import React from "react";
import { Modal, Button } from "react-bootstrap";

const HeadBodyModal = ({ show, onHide, endpoint, comparisonResult }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Endpoint Comparison</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h5>Endpoint: {endpoint ? endpoint.url : "N/A"}</h5>
      <pre>{comparisonResult}</pre>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

export default HeadBodyModal;
