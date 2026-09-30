"""
Profiling package for generating dataset metadata and statistics deterministically.
"""
from .profiler import load_dataset_dataframe, profile_dataset_dataframe

__all__ = ["load_dataset_dataframe", "profile_dataset_dataframe"]
