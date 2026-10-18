"""Implementa el puerto Clock con la fecha real del sistema."""

from datetime import date


class SystemClock:
    def today(self) -> date:
        return date.today()
