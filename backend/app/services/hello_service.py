class HelloService:
    def greet(self, name: str | None = None) -> str:
        return f"Hello, {name}!" if name else "Hello, World!"
