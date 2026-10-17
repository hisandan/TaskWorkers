from app.services.hello_service import HelloService


def test_greet_without_name_returns_default():
    assert HelloService().greet() == "Hello, World!"


def test_greet_with_name():
    assert HelloService().greet("Ana") == "Hello, Ana!"
