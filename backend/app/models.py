from pydantic import BaseModel, Field


class ColumnConfig(BaseModel):
    """Describes a single column of a system's result table."""

    key: str
    label: str
    type: str = "text"  # text | number | currency | percent | date | url


class OutputConfig(BaseModel):
    mode: str = "file"  # "file" -> the script writes JSON to $PH_OUTPUT_FILE
    columns: list[ColumnConfig] = Field(default_factory=list)


class ExportConfig(BaseModel):
    enabled: bool = True
    filename_prefix: str | None = None


class SystemConfig(BaseModel):
    """Configuration for one modular system, loaded from systems/<id>/config.json."""

    id: str
    name: str
    description: str
    icon: str = "\U0001F9E9"
    category: str = "Outros"
    repository: str = ""
    command: str | None = None
    timeout_seconds: int = 900
    status: str = "ready"  # ready | coming_soon
    output: OutputConfig = Field(default_factory=OutputConfig)
    export: ExportConfig = Field(default_factory=ExportConfig)
