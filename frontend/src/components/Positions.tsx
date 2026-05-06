import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3010';

type Position = {
  id: number;
  title: string;
  manager: string;
  deadline: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  Open: 'Abierto',
  Filled: 'Contratado',
  Closed: 'Cerrado',
  Draft: 'Borrador',
};

const statusVariants: Record<string, string> = {
  Open: 'warning',
  Filled: 'success',
  Closed: 'dark',
  Draft: 'secondary',
};

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchText, setSearchText] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPositions = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/positions`);

        if (!response.ok) {
          throw new Error(`Error ${response.status} al consultar posiciones`);
        }

        setPositions(await response.json());
      } catch (caughtError) {
        setPositions([]);
        setError(caughtError instanceof Error ? caughtError.message : 'Error inesperado al cargar posiciones');
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, []);

  const managers = useMemo(() => Array.from(new Set(positions.map((position) => position.manager).filter(Boolean))), [positions]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesText = position.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesDeadline = !deadlineFilter || position.deadline === deadlineFilter;
      const matchesStatus = !statusFilter || position.status === statusFilter;
      const matchesManager = !managerFilter || position.manager === managerFilter;

      return matchesText && matchesDeadline && matchesStatus && matchesManager;
    });
  }, [deadlineFilter, managerFilter, positions, searchText, statusFilter]);

  return (
    <Container className="py-5">
      <div className="mb-4">
        <Link to="/" className="small text-decoration-none">
          Volver al dashboard
        </Link>
        <h1 className="h2 mb-1">Posiciones</h1>
        <p className="text-muted mb-0">Selecciona una posicion para gestionar su proceso de contratacion.</p>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Form.Control
            type="search"
            placeholder="Buscar por titulo"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Control
            type="date"
            value={deadlineFilter}
            onChange={(event) => setDeadlineFilter(event.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Estado</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)}>
            <option value="">Manager</option>
            {managers.map((manager) => (
              <option key={manager} value={manager}>
                {manager}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading && (
        <div className="position-detail__loading">
          <Spinner animation="border" role="status" />
          <span>Cargando posiciones...</span>
        </div>
      )}

      <Row className="g-4">
        {!loading && filteredPositions.length === 0 && !error && (
          <Col>
            <Alert variant="light" className="border">
              No hay posiciones que coincidan con los filtros.
            </Alert>
          </Col>
        )}

        {!loading && filteredPositions.map((position) => (
          <Col md={6} lg={4} key={position.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <Card.Title className="h5 mb-0">{position.title}</Card.Title>
                  <Badge bg={statusVariants[position.status] || 'secondary'} text={position.status === 'Open' ? 'dark' : 'white'}>
                    {statusLabels[position.status] || position.status}
                  </Badge>
                </div>
                <Card.Text className="text-muted">
                  Manager: {position.manager}
                  <br />
                  Deadline: {position.deadline}
                </Card.Text>
                <Link to={`/position/${position.id}`} className="mt-auto">
                  <Button variant="primary" className="w-100">
                    Ver proceso
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Positions;
