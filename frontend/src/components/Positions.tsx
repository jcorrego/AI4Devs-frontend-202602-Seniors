import React, { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

type Position = {
  id: number;
  title: string;
  manager: string;
  deadline: string;
  status: 'Open' | 'Filled' | 'Closed' | 'Draft';
};

const positions: Position[] = [
  { id: 1, title: 'Senior Full-Stack Engineer', manager: 'Alice Johnson', deadline: '2024-12-31', status: 'Open' },
  { id: 2, title: 'Data Scientist', manager: 'Bob Miller', deadline: '2024-12-31', status: 'Open' },
  { id: 3, title: 'Product Manager', manager: 'Alex Jones', deadline: '2024-07-31', status: 'Draft' },
];

const statusLabels: Record<Position['status'], string> = {
  Open: 'Abierto',
  Filled: 'Contratado',
  Closed: 'Cerrado',
  Draft: 'Borrador',
};

const statusVariants: Record<Position['status'], string> = {
  Open: 'warning',
  Filled: 'success',
  Closed: 'dark',
  Draft: 'secondary',
};

const Positions: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');

  const managers = useMemo(() => Array.from(new Set(positions.map((position) => position.manager))), []);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesText = position.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesDeadline = !deadlineFilter || position.deadline === deadlineFilter;
      const matchesStatus = !statusFilter || position.status === statusFilter;
      const matchesManager = !managerFilter || position.manager === managerFilter;

      return matchesText && matchesDeadline && matchesStatus && matchesManager;
    });
  }, [deadlineFilter, managerFilter, searchText, statusFilter]);

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

      <Row className="g-4">
        {filteredPositions.map((position) => (
          <Col md={6} lg={4} key={position.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <Card.Title className="h5 mb-0">{position.title}</Card.Title>
                  <Badge bg={statusVariants[position.status]} text={position.status === 'Open' ? 'dark' : 'white'}>
                    {statusLabels[position.status]}
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
