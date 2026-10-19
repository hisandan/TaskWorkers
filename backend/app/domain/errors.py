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


class AssignmentNotFound(NotFound):
    pass


class MissingSkills(Conflict):
    """RN6: al trabajador le faltan skills de la tarea."""


class TaskDone(Conflict):
    """RN8: solo se asignan tareas not-done."""


class TaskAlreadyAssigned(Conflict):
    """RN9: una tarea se asigna una sola vez."""


class WorkerBusy(Conflict):
    """RN25: alguna tarea del trabajador perdería su día de inicio."""


class HasAssignments(Conflict):
    """RN24: no se borra un trabajador o una tarea con asignaciones."""


class InvalidEffort(InvalidInput):
    """RN1: el esfuerzo es un entero de horas mayor que 0."""


class InvalidStatus(InvalidInput):
    """RN2: el estado es done o not-done."""


class InvalidAvailability(InvalidInput):
    """RN4: la disponibilidad es un entero de horas por día, entre 1 y 24."""


class StartInPast(InvalidInput):
    """RN11: la fecha de inicio no puede estar en el pasado."""


class StartNotBusinessDay(InvalidInput):
    """RN13: una asignación manual no puede iniciar en fin de semana."""
