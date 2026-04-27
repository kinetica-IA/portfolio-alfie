"""Pydantic v2 base classes for pipeline schema validation.

Every L1 parser declares two schemas:
- A `<Name>RawJSON` model for raw Polar JSON input.
- A `<Name>Row` model for output DataFrame rows.

Pydantic validates input on read (clear error if Polar changes format)
and validates output structure before writing parquet (catches drift
between what the parser claims to produce and what it actually produces).
"""

from __future__ import annotations
from datetime import date
from pydantic import BaseModel, ConfigDict


class PipelineModel(BaseModel):
    """Base for all pipeline schemas.

    ``extra='ignore'`` lets us declare only the fields we care about while
    Polar's JSON often contains many we don't use. Forward compatibility
    with Polar additions is intentional.
    """

    model_config = ConfigDict(
        extra="ignore",
        str_strip_whitespace=True,
        frozen=False,
    )


class DataFrameRow(PipelineModel):
    """Base for output DataFrame row schemas. All rows carry a date."""

    date: date
