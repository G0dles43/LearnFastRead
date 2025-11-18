import queue
import threading
import time
import logging
from concurrent.futures import Future

logger = logging.getLogger(__name__)

class GeminiRequestQueue:
    """
    Kolejka zapytań do Gemini API (wersja synchroniczna/wątkowa).
    Zapewnia, że tylko jedno zapytanie jest przetwarzane naraz, z zachowaniem odstępu czasowego.
    """
    def __init__(self):
        self._queue = queue.Queue()
        self._worker_thread = threading.Thread(target=self._worker, daemon=True)
        self._worker_thread.start()

    def process_request(self, func, *args, **kwargs):
        """
        Dodaje zapytanie do kolejki i BLOKUJE wykonanie aż do otrzymania wyniku.
        Dzięki temu widok Django czeka na swoją kolej.
        """
        future = Future()
        self._queue.put((func, args, kwargs, future))
        
        return future.result()

    def _worker(self):
        """
        Przetwarza kolejkę w nieskończonej pętli.
        """
        while True:
            func, args, kwargs, future = self._queue.get()
            try:
                result = func(*args, **kwargs)
                future.set_result(result)
            except Exception as e:
                logger.error(f"Błąd w Gemini Queue: {e}")
                future.set_exception(e)
            finally:
                self._queue.task_done()
                
                time.sleep(2)

gemini_queue = GeminiRequestQueue()