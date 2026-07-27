from fastapi import FastAPI

from ordering.adapters.primary.http import create_order_router
from ordering.adapters.secondary.email_order_notifier import EmailOrderNotifier
from ordering.adapters.secondary.sql_order_repository import SqlOrderRepository
from ordering.application.submit_order_use_case import SubmitOrderUseCase


def create_app() -> FastAPI:
    order_repository = SqlOrderRepository()
    order_notifier = EmailOrderNotifier(order_repository)
    submit_order_use_case = SubmitOrderUseCase(
        order_repository,
        order_notifier,
    )

    app = FastAPI(title="Tenets Architecture Review Demo")
    app.include_router(create_order_router(submit_order_use_case))
    return app


app = create_app()
