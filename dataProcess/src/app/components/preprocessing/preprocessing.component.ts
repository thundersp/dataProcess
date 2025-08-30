import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-preprocessing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preprocessing.component.html',
  styleUrls: ['./preprocessing.component.css']
})
export class PreprocessingComponent implements OnInit, OnDestroy {
  dataset: Dataset | null = null;
  numericColumns: number[] = [];
  selectedColumnIndex: number | null = null;
  subscription: Subscription | null = null;
  normalizedData: number[] = [];
  hasRemovedMissingValues: boolean = false;
  removedRowsCount: number = 0;
  normalizationMethod: 'minmax' | 'zscore' | 'decimal' = 'minmax';
  binnedData: number[] = [];
  numberOfBins: number = 3;
  chiSquaredResult: number | null = null;
  selectedColumn1: number | null = null;
  selectedColumn2: number | null = null;

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.subscription = this.datasetService.dataset$.subscribe(ds => {
      this.dataset = ds;
      if (this.dataset) {
        this.numericColumns = this.dataset.headers
          .map((_, i) => i)
          .filter(i => typeof this.dataset?.rows[0][i] === 'number');
        this.selectedColumnIndex = this.numericColumns[0] ?? null;
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getColumnData(index: number): number[] {
    if (!this.dataset) return [];
    return this.dataset.rows.map(row => Number(row[index]));
  }

  computeMean(data: number[]): number {
    return parseFloat((data.reduce((a, b) => a + b, 0) / data.length).toFixed(3));
  }

  computeVariance(data: number[], mean: number): number {
    const sumSq = data.reduce((sum, val) => sum + (val - mean) ** 2, 0);
    return parseFloat((sumSq / data.length).toFixed(3));
  }

  minMaxNormalization(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map(v => parseFloat(((v - min) / (max - min)).toFixed(3)));
  }

  zScoreNormalization(data: number[]): number[] {
    const mean = this.computeMean(data);
    const stdDev = Math.sqrt(this.computeVariance(data, mean));
    return data.map(v => parseFloat(((v - mean) / stdDev).toFixed(3)));
  }

  decimalScaling(data: number[]): number[] {
    const maxAbs = Math.max(...data.map(Math.abs));
    const j = Math.ceil(Math.log10(maxAbs));
    return data.map(v => parseFloat((v / Math.pow(10, j)).toFixed(3)));
  }

  removeMissingValues() {
    if (!this.dataset) return;
    
    const cleanedRows = this.dataset.rows.filter(row => 
      row.every(cell => cell !== null && cell !== undefined && cell !== '')
    );
    
    this.removedRowsCount = this.dataset.rows.length - cleanedRows.length;
    
    this.dataset = {
      fileName: this.dataset.fileName,
      headers: this.dataset.headers,
      rows: cleanedRows
    };
    
    this.hasRemovedMissingValues = true;
    this.datasetService.setDataset(this.dataset);
  }

  applyNormalization() {
    if (this.selectedColumnIndex === null || !this.dataset) return;
    const data = this.getColumnData(this.selectedColumnIndex);
    
    switch(this.normalizationMethod) {
      case 'minmax':
        this.normalizedData = this.minMaxNormalization(data);
        break;
      case 'zscore':
        this.normalizedData = this.zScoreNormalization(data);
        break;
      case 'decimal':
        this.normalizedData = this.decimalScaling(data);
        break;
    }
  }

  discretizeBinning() {
    if (this.selectedColumnIndex === null || !this.dataset) return;
    const data = this.getColumnData(this.selectedColumnIndex);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const width = (max - min) / this.numberOfBins;
    
    this.binnedData = data.map(v => Math.floor((v - min) / width));
  }

  calculateChiSquared() {
    if (!this.dataset || !this.selectedColumn1 || !this.selectedColumn2) return;
    
    const col1 = this.getColumnData(this.selectedColumn1);
    const col2 = this.getColumnData(this.selectedColumn2);
    
    // Calculate observed frequencies
    const observed: { [key: string]: number } = {};
    const expected: { [key: string]: number } = {};
    
    // Count observations
    for (let i = 0; i < col1.length; i++) {
      const key = `${col1[i]}_${col2[i]}`;
      observed[key] = (observed[key] || 0) + 1;
    }
    
    // Calculate expected frequencies
    const rowTotals: { [key: number]: number } = {};
    const colTotals: { [key: number]: number } = {};
    const n = col1.length;
    
    col1.forEach((val, i) => {
      rowTotals[val] = (rowTotals[val] || 0) + 1;
      colTotals[col2[i]] = (colTotals[col2[i]] || 0) + 1;
    });
    
    // Calculate chi-squared statistic
    let chiSquared = 0;
    Object.keys(observed).forEach(key => {
      const [row, col] = key.split('_').map(Number);
      const exp = (rowTotals[row] * colTotals[col]) / n;
      expected[key] = exp;
      chiSquared += Math.pow(observed[key] - exp, 2) / exp;
    });
    
    this.chiSquaredResult = parseFloat(chiSquared.toFixed(3));
  }
}
