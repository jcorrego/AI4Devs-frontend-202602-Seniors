import React, { DragEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3010';

type InterviewStep = {
  id: number;
  name: string;
  orderIndex: number;
};

type Candidate = {
  id: number;
  applicationId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number | null;
};

type InterviewFlowPayload = {
  positionName: string;
  interviewFlow: {
    id: number;
    description: string;
    interviewSteps: InterviewStep[];
  };
};

type InterviewFlowResponse = InterviewFlowPayload | { interviewFlow: InterviewFlowPayload };

const readJson = async <T,>(urls: string[]): Promise<T> => {
  let lastError = 'No se pudo conectar con el servidor';

  for (const url of urls) {
    const response = await fetch(url);

    if (response.ok) {
      return response.json();
    }

    lastError = `Error ${response.status} al consultar ${url}`;
  }

  throw new Error(lastError);
};

const normalizeInterviewFlow = (payload: InterviewFlowResponse): InterviewFlowPayload => {
  if ('positionName' in payload) {
    return payload;
  }

  return payload.interviewFlow;
};

const getInitials = (fullName: string) =>
  fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatScore = (score: number | null | undefined) => {
  return typeof score === 'number' && Number.isFinite(score) ? score.toFixed(1) : '-';
};

const PositionDetail: React.FC = () => {
  const { positionId } = useParams();
  const [positionName, setPositionName] = useState('Posicion');
  const [interviewSteps, setInterviewSteps] = useState<InterviewStep[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dropTargetStepId, setDropTargetStepId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const numericPositionId = Number(positionId);

  const candidatesByStep = useMemo(() => {
    return interviewSteps.reduce<Record<string, Candidate[]>>((groups, step) => {
      groups[step.name] = candidates.filter((candidate) => candidate.currentInterviewStep === step.name);
      return groups;
    }, {});
  }, [candidates, interviewSteps]);

  const averageScore = useMemo(() => {
    if (candidates.length === 0) {
      return '0.0';
    }

    const scores = candidates
      .map((candidate) => candidate.averageScore)
      .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));

    if (scores.length === 0) {
      return '-';
    }

    const totalScore = scores.reduce((total, score) => total + score, 0);
    return (totalScore / scores.length).toFixed(1);
  }, [candidates]);

  const loadPosition = useCallback(async () => {
    if (!numericPositionId || Number.isNaN(numericPositionId)) {
      setPositionName('Posicion');
      setInterviewSteps([]);
      setCandidates([]);
      setSuccessMessage('');
      setError('El identificador de la posicion no es valido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [flowPayload, candidatesPayload] = await Promise.all([
        readJson<InterviewFlowResponse>([
          `${API_BASE_URL}/position/${numericPositionId}/interviewflow`,
          `${API_BASE_URL}/positions/${numericPositionId}/interviewFlow`,
        ]),
        readJson<Candidate[]>([
          `${API_BASE_URL}/position/${numericPositionId}/candidates`,
          `${API_BASE_URL}/positions/${numericPositionId}/candidates`,
        ]),
      ]);

      const flow = normalizeInterviewFlow(flowPayload);
      const orderedSteps = [...flow.interviewFlow.interviewSteps].sort(
        (first, second) => first.orderIndex - second.orderIndex || first.id - second.id
      );

      setPositionName(flow.positionName);
      setInterviewSteps(orderedSteps);
      setCandidates(candidatesPayload);
    } catch (caughtError) {
      setInterviewSteps([]);
      setCandidates([]);
      setError(caughtError instanceof Error ? caughtError.message : 'Error inesperado al cargar la posicion');
    } finally {
      setLoading(false);
    }
  }, [numericPositionId]);

  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  const handleDragStart = (candidate: Candidate) => {
    setDraggedCandidate(candidate);
    setSuccessMessage('');
    setError('');
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, stepId: number) => {
    event.preventDefault();
    setDropTargetStepId(stepId);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;

    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setDropTargetStepId(null);
    }
  };

  const moveCandidateToStep = async (candidateToMove: Candidate, step: InterviewStep) => {
    if (candidateToMove.currentInterviewStep === step.name) {
      return;
    }

    const previousCandidates = candidates;
    const movedCandidate = { ...candidateToMove, currentInterviewStep: step.name };

    setSaving(true);
    setError('');
    setSuccessMessage('');
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) => (candidate.applicationId === movedCandidate.applicationId ? movedCandidate : candidate))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${candidateToMove.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: candidateToMove.applicationId,
          currentInterviewStep: step.id,
        }),
      });

      if (!response.ok) {
        const fallbackResponse = await fetch(`${API_BASE_URL}/candidates/${candidateToMove.id}/stage`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId: candidateToMove.applicationId,
            currentInterviewStep: step.id,
          }),
        });

        if (!fallbackResponse.ok) {
          const errorBody = await fallbackResponse.json().catch(() => null);
          throw new Error(errorBody?.message || 'No se pudo actualizar la fase del candidato');
        }
      }

      setSuccessMessage(`${candidateToMove.fullName} movido a ${step.name}`);
    } catch (caughtError) {
      setCandidates(previousCandidates);
      setError(caughtError instanceof Error ? caughtError.message : 'Error inesperado al actualizar la fase');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, step: InterviewStep) => {
    event.preventDefault();
    setDropTargetStepId(null);

    if (!draggedCandidate || draggedCandidate.currentInterviewStep === step.name) {
      setDraggedCandidate(null);
      return;
    }

    try {
      await moveCandidateToStep(draggedCandidate, step);
    } finally {
      setDraggedCandidate(null);
    }
  };

  return (
    <Container fluid className="position-detail">
      <div className="position-detail__shell">
        <div className="position-detail__hero">
          <div className="position-detail__header">
            <Link to="/positions" className="position-detail__back" aria-label="Volver a posiciones">
              &larr;
            </Link>
            <div>
              <span className="position-detail__eyebrow">Proceso de seleccion</span>
              <h1>{positionName}</h1>
              <p>Gestiona candidatos por fase, revisa puntuaciones y arrastra tarjetas para actualizar el proceso.</p>
            </div>
          </div>

          <div className="position-detail__metrics">
            <div>
              <span>Candidatos</span>
              <strong>{candidates.length}</strong>
            </div>
            <div>
              <span>Fases</span>
              <strong>{interviewSteps.length}</strong>
            </div>
            <div>
              <span>Score medio</span>
              <strong>{averageScore}</strong>
            </div>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {loading ? (
          <div className="position-detail__loading">
            <Spinner animation="border" role="status" />
            <span>Cargando proceso...</span>
          </div>
        ) : (
          <Row className="kanban-board g-3">
            {interviewSteps.map((step) => {
              const stepCandidates = candidatesByStep[step.name] || [];
              const isDropTarget = dropTargetStepId === step.id;

              return (
                <Col xs={12} lg key={step.id}>
                  <div
                    className={`kanban-column ${isDropTarget ? 'kanban-column--active' : ''}`}
                    onDragOver={(event) => handleDragOver(event, step.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(event) => handleDrop(event, step)}
                  >
                    <div className="kanban-column__header">
                      <div>
                        <span>Fase {step.orderIndex}</span>
                        <h2>{step.name}</h2>
                      </div>
                      <Badge bg="light" text="dark">
                        {stepCandidates.length}
                      </Badge>
                    </div>

                    <div className="kanban-column__cards">
                      {stepCandidates.length === 0 && <p className="kanban-column__empty">Suelta aqui el siguiente candidato</p>}
                      {stepCandidates.map((candidate) => (
                        <Card
                          key={candidate.applicationId}
                          draggable={!saving}
                          onDragStart={() => handleDragStart(candidate)}
                          onDragEnd={() => {
                            setDraggedCandidate(null);
                            setDropTargetStepId(null);
                          }}
                          className="candidate-card"
                        >
                          <Card.Body>
                            <div className="candidate-card__top">
                              <div className="candidate-card__avatar">{getInitials(candidate.fullName)}</div>
                              <div>
                                <Card.Title>{candidate.fullName}</Card.Title>
                                <span>Application #{candidate.applicationId}</span>
                              </div>
                            </div>
                            <div className="candidate-card__score">
                              <span>Puntuacion media</span>
                              <strong>{formatScore(candidate.averageScore)}</strong>
                            </div>
                            <Form.Select
                              aria-label={`Mover ${candidate.fullName} a otra fase`}
                              className="candidate-card__move"
                              disabled={saving}
                              onChange={(event) => {
                                const targetStep = interviewSteps.find((option) => option.id === Number(event.target.value));
                                if (targetStep) {
                                  moveCandidateToStep(candidate, targetStep);
                                }
                              }}
                              size="sm"
                              value=""
                            >
                              <option value="">Mover a...</option>
                              {interviewSteps
                                .filter((option) => option.name !== candidate.currentInterviewStep)
                                .map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                            </Form.Select>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </Container>
  );
};

export default PositionDetail;
