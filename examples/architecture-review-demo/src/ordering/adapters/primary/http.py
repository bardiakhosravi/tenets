from fastapi import APIRouter, HTTPException

from ordering.application.submit_order_use_case import SubmitOrderUseCase


def create_order_router(
    submit_order_use_case: SubmitOrderUseCase,
) -> APIRouter:
    router = APIRouter()

    @router.post("/orders/{order_id}/submit", status_code=204)
    def submit_order(order_id: str) -> None:
        try:
            submit_order_use_case.execute(order_id)
        except ValueError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    return router
