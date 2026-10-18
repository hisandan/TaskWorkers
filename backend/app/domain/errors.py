"""Errores de negocio. El dominio no conoce HTTP: app/adapters/http/errors.py traduce cada grupo a un código."""


class DomainError(Exception):
    pass


# Grupos: la entidad no existe / la operación choca con el estado actual / el dato es inválido por sí solo


class NotFound(DomainError):
    pass


class Conflict(DomainError):
    pass


class InvalidInput(DomainError):
    pass


class TaskNotFound(NotFound):
    pass


class WorkerNotFound(NotFound):
    pass


class MissingSkills(Conflict):
    """RN6: al trabajador le faltan skills de la tarea."""


class TaskDone(Conflict):
    """RN8: solo se asignan tareas not-done."""


class TaskAlreadyAssigned(Conflict):
    """RN9: una tarea se asigna una sola vez."""


class HasAssignments(Conflict):
    """RN24: no se borra un trabajador o una tarea con asignaciones."""


class StartInPast(InvalidInput):
    """RN11: la fecha de inicio no puede estar en el pasado."""
