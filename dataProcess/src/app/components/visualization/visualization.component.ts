import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-visualization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.css']
})
export class VisualizationComponent implements OnInit, OnDestroy, AfterViewInit {
  dataset: Dataset | null = null;
  subscription: Subscription | null = null;
  numericColumns: number[] = [];
  selectedColumnIndex: number | null = null;
  selectedColumn2Index: number | null = null;
  chartType: 'bar' | 'line' | 'scatter' | 'comparison' = 'bar';
  chart: Chart | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.subscription = this.datasetService.dataset$.subscribe(ds => {
      this.dataset = ds;
      if (ds) {
        this.numericColumns = ds.headers
          .map((_, i) => i)
          .filter(i => typeof ds.rows[0][i] === 'number');
        this.selectedColumnIndex = this.numericColumns[0] ?? null;
        this.renderChart();
      }
    });
  }

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.chart?.destroy();
  }

  onColumnChange(index: number) {
    this.selectedColumnIndex = index;
    this.renderChart();
  }

  onChartTypeChange(type: 'bar' | 'line' | 'scatter' | 'comparison') {
    this.chartType = type;
    this.renderChart();
  }

  renderChart() {
    if (!this.dataset || this.selectedColumnIndex === null || !this.chartCanvas?.nativeElement) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    if (this.chartType === 'comparison' && this.selectedColumn2Index !== null) {
      this.renderComparisonChart(ctx);
      return;
    }

    const dataValues = this.dataset.rows.map(row => Number(row[this.selectedColumnIndex!]));
    const labels = this.dataset.rows.map((_, i) => `Row ${i + 1}`);

    const config: ChartConfiguration = {
      type: this.chartType === 'comparison' ? 'scatter' : this.chartType,
      data: {
        labels: labels,
        datasets: [{
          label: this.dataset.headers[this.selectedColumnIndex!],
          data: this.chartType === 'scatter'
            ? dataValues.map((v, i) => ({ x: i + 1, y: v }))
            : dataValues,
          backgroundColor: 'rgba(122, 28, 172, 0.5)',
          borderColor: '#7A1CAC',
          borderWidth: 2,
          fill: this.chartType === 'bar',
          tension: 0.3,
          pointRadius: this.chartType === 'scatter' ? 6 : 4,
          pointBackgroundColor: '#7A1CAC'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              color: '#7A1CAC',
              font: {
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: `Visualization of ${this.dataset.headers[this.selectedColumnIndex!]}`,
            color: '#7A1CAC',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            type: this.chartType === 'scatter' ? 'linear' : 'category',
            grid: {
              color: 'rgba(235, 211, 248, 0.3)'
            },
            ticks: {
              color: '#7A1CAC'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(235, 211, 248, 0.3)'
            },
            ticks: {
              color: '#7A1CAC'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  renderComparisonChart(ctx: CanvasRenderingContext2D) {
    if (!this.dataset || !this.selectedColumn2Index || !this.selectedColumnIndex) return;

    const xValues = this.dataset.rows.map(row => Number(row[this.selectedColumnIndex!]));
    const yValues = this.dataset.rows.map(row => Number(row[this.selectedColumn2Index!]));

    const config: ChartConfiguration = {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${this.dataset.headers[this.selectedColumnIndex!]} vs ${this.dataset.headers[this.selectedColumn2Index]}`,
          data: xValues.map((x, i) => ({ x, y: yValues[i] })),
          backgroundColor: 'rgba(122, 28, 172, 0.5)',
          borderColor: '#7A1CAC',
          borderWidth: 2,
          pointRadius: 6,
          pointBackgroundColor: '#7A1CAC'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              color: '#7A1CAC',
              font: { weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: 'Column Comparison',
            color: '#7A1CAC',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: this.dataset.headers[this.selectedColumnIndex!]
            },
            grid: {
              color: 'rgba(235, 211, 248, 0.3)'
            },
            ticks: { color: '#7A1CAC' }
          },
          y: {
            title: {
              display: true,
              text: this.dataset.headers[this.selectedColumn2Index]
            },
            grid: {
              color: 'rgba(235, 211, 248, 0.3)'
            },
            ticks: { color: '#7A1CAC' }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
