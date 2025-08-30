import seaborn as sns
import matplotlib.pyplot as plt
import io
import math
import base64
from typing import Dict, Any
import pandas as pd
import numpy as np
from scipy import stats as spstats
import matplotlib
matplotlib.use('Agg')  # non-GUI backend


class DataProcessor:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def clean(self) -> Dict[str, Any]:
        report = {}
        # Initial info
        report['initial_shape'] = self.df.shape
        # Remove duplicate rows
        dup_count = self.df.duplicated().sum()
        if dup_count:
            self.df = self.df.drop_duplicates()
        report['duplicates_removed'] = int(dup_count)
        # Handle missing values by strategy (numeric: median, object: mode)
        missing = self.df.isna().sum().to_dict()
        report['missing_before'] = missing
        for col in self.df.columns:
            if self.df[col].isna().any():
                if pd.api.types.is_numeric_dtype(self.df[col]):
                    self.df[col].fillna(self.df[col].median(), inplace=True)
                else:
                    self.df[col].fillna(
                        self.df[col].mode().iloc[0], inplace=True)
        report['missing_after'] = self.df.isna().sum().to_dict()
        # Basic outlier removal using z-score > 4 for numeric columns
        outlier_cols = {}
        for col in self.df.select_dtypes(include=[np.number]).columns:
            z = np.abs(spstats.zscore(self.df[col], nan_policy='omit'))
            if z is not None and not isinstance(z, float):
                mask = z > 4
                count = int(np.sum(mask))
                if count:
                    outlier_cols[col] = count
                    self.df = self.df[~mask]
        report['outliers_removed'] = outlier_cols
        report['final_shape'] = self.df.shape
        return report

    def central_tendency(self) -> Dict[str, Dict[str, float]]:
        numeric = self.df.select_dtypes(include=[np.number])
        return {
            col: {
                'mean': float(numeric[col].mean()),
                'median': float(numeric[col].median()),
                'mode': float(numeric[col].mode().iloc[0]) if not numeric[col].mode().empty else math.nan
            } for col in numeric.columns
        }

    def dispersion(self) -> Dict[str, Dict[str, float]]:
        numeric = self.df.select_dtypes(include=[np.number])
        return {
            col: {
                'variance': float(numeric[col].var()),
                'std_dev': float(numeric[col].std()),
                'min': float(numeric[col].min()),
                'max': float(numeric[col].max()),
                'range': float(numeric[col].max() - numeric[col].min()),
                'q1': float(numeric[col].quantile(0.25)),
                'q3': float(numeric[col].quantile(0.75)),
                'iqr': float(numeric[col].quantile(0.75) - numeric[col].quantile(0.25))
            } for col in numeric.columns
        }

    def chi_square(self) -> Dict[str, Any]:
        # Perform chi-square test for pairs of categorical variables
        cat_cols = self.df.select_dtypes(
            include=['object', 'category']).columns
        results = {}
        for i, c1 in enumerate(cat_cols):
            for c2 in cat_cols[i+1:]:
                contingency = pd.crosstab(self.df[c1], self.df[c2])
                chi2, p, dof, expected = spstats.chi2_contingency(contingency)
                results[f'{c1}_vs_{c2}'] = {
                    'chi2': float(chi2), 'p_value': float(p), 'dof': int(dof)
                }
        return results

    def correlation_covariance(self) -> Dict[str, Any]:
        numeric = self.df.select_dtypes(include=[np.number])
        return {
            'correlation': numeric.corr().fillna(0).to_dict(),
            'covariance': numeric.cov().fillna(0).to_dict()
        }

    def normalization(self) -> Dict[str, Any]:
        numeric = self.df.select_dtypes(include=[np.number])
        min_max = {}
        z_score = {}
        decimal_scaling = {}
        for col in numeric.columns:
            series = numeric[col]
            min_val, max_val = series.min(), series.max()
            if max_val - min_val == 0:
                min_max[col] = []
            else:
                min_max[col] = ((series - min_val) /
                                (max_val - min_val)).round(5).tolist()
            z_score[col] = ((series - series.mean()) / (series.std()
                            if series.std() else 1)).round(5).tolist()
            max_abs = series.abs().max()
            j = int(math.ceil(math.log10(max_abs + 1))) if max_abs != 0 else 1
            decimal_scaling[col] = (series / (10 ** j)).round(5).tolist()
        return {'min_max': min_max, 'z_score': z_score, 'decimal_scaling': decimal_scaling}

    def discretization(self, bins: int = 5) -> Dict[str, Any]:
        numeric = self.df.select_dtypes(include=[np.number])
        disc = {}
        for col in numeric.columns:
            disc[col] = pd.cut(numeric[col], bins=bins,
                               labels=False, duplicates='drop').tolist()
        return disc

    def visualizations(self) -> Dict[str, Any]:
        plots = {}
        numeric_cols = self.df.select_dtypes(
            include=[np.number]).columns.tolist()
        for col in numeric_cols:
            fig, ax = plt.subplots(figsize=(4, 3))
            sns.histplot(self.df[col], kde=True, ax=ax)
            ax.set_title(f'Distribution of {col}')
            buf = io.BytesIO()
            fig.tight_layout()
            fig.savefig(buf, format='png')
            buf.seek(0)
            plots[f'hist_{col}'] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        if len(numeric_cols) >= 2:
            fig, ax = plt.subplots(figsize=(4, 3))
            sns.heatmap(self.df[numeric_cols].corr(),
                        annot=False, cmap='viridis', ax=ax)
            ax.set_title('Correlation Heatmap')
            buf = io.BytesIO()
            fig.tight_layout()
            fig.savefig(buf, format='png')
            buf.seek(0)
            plots['correlation_heatmap'] = base64.b64encode(
                buf.read()).decode('utf-8')
            plt.close(fig)
        return plots

    def compute_all(self) -> Dict[str, Any]:
        cleaning_report = self.clean()
        stats = {
            'central_tendency': self.central_tendency(),
            'dispersion': self.dispersion(),
            'chi_square': self.chi_square(),
            'correlation': self.correlation_covariance()['correlation'],
            'covariance': self.correlation_covariance()['covariance'],
            'normalization': self.normalization(),
            'discretization': self.discretization(),
            'visualizations': self.visualizations(),
            'cleaning_report': cleaning_report,
        }
        return stats
