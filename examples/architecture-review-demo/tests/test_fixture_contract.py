import ast
from pathlib import Path
import unittest


FIXTURE_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = FIXTURE_ROOT / "src" / "ordering"


def parse(relative_path: str) -> ast.Module:
    return ast.parse((SOURCE_ROOT / relative_path).read_text(encoding="utf-8"))


class ArchitectureReviewDemoContractTest(unittest.TestCase):
    def test_use_case_imports_concrete_repository_adapter(self) -> None:
        tree = parse("application/submit_order_use_case.py")
        imported_modules = {
            node.module
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
        }

        self.assertIn(
            "ordering.adapters.secondary.sql_order_repository",
            imported_modules,
        )

    def test_notifier_port_uses_primitive_domain_values(self) -> None:
        tree = parse("application/ports/order_notifier.py")
        method = next(
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.FunctionDef)
            and node.name == "send_confirmation"
        )
        annotations = {
            argument.arg: ast.unparse(argument.annotation)
            for argument in method.args.args
            if argument.annotation is not None
        }

        self.assertEqual(annotations["order_id"], "str")
        self.assertEqual(annotations["email"], "str")

    def test_notifier_adapter_receives_and_calls_repository(self) -> None:
        tree = parse("adapters/secondary/email_order_notifier.py")
        constructor = next(
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.FunctionDef) and node.name == "__init__"
        )
        repository_parameter = next(
            argument
            for argument in constructor.args.args
            if argument.arg == "order_repository"
        )
        repository_calls = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "get"
        ]

        self.assertEqual(
            ast.unparse(repository_parameter.annotation),
            "OrderRepository",
        )
        self.assertEqual(len(repository_calls), 1)


if __name__ == "__main__":
    unittest.main()
