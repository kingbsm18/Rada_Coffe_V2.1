"""RADA Coffee R1 edge runtime.

Implemented: crash-safe local event log (ARC-4) and the acknowledgement-driven sync loop.
Not implemented: camera ingestion, inference, tracking, HR event interpretation, transport,
configuration sync, evidence buffering. Those depend on the Edge Runtime architecture document.
"""

__version__ = "0.1.0"
