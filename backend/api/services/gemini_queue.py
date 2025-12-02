import asyncio
import logging
from typing import Callable, Any
from functools import wraps

logger = logging.getLogger(__name__)

class GeminiQueue:
    """
    Kolejka zapytań do Gemini API.
    Zapewnia, że tylko jedno zapytanie jest przetwarzane naraz.
    """
    def __init__(self):
        self._queue = asyncio.Queue()
        self._processing = False
        self._lock = asyncio.Lock()

    async def add_request(self, func: Callable, *args, **kwargs) -> Any:
        """
        Dodaje zapytanie do kolejki i czeka na wynik.
        """
        future = asyncio.Future()
        await self._queue.put((func, args, kwargs, future))
        
        if not self._processing:
            asyncio.create_task(self._process_queue())
        
        return await future

    async def _process_queue(self):
        """
        Przetwarza kolejkę zapytań jedno po drugim.
        """
        async with self._lock:
            if self._processing:
                return
            self._processing = True

        try:
            while not self._queue.empty():
                func, args, kwargs, future = await self._queue.get()
                
                try:
                    result = await asyncio.get_event_loop().run_in_executor(
                        None, 
                        lambda: func(*args, **kwargs)
                    )
                    future.set_result(result)
                except Exception as e:
                    logger.error(f"Błąd w Gemini Queue: {e}")
                    future.set_exception(e)
                
                self._queue.task_done()
                
                await asyncio.sleep(2)
        finally:
            self._processing = False

gemini_queue = GeminiQueue()