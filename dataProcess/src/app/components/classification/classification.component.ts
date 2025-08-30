import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatasetService, Dataset } from '../../services/dataset.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-classification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css']
})
export class ClassificationComponent implements OnInit, OnDestroy {
  dataset: Dataset | null = null;
  subscription: Subscription | null = null;
  activeTab: 'selection' | 'results' = 'selection';
  targetColumn: number | null = null;
  selectedClassifier: string | null = null;
  numericColumns: number[] = [];
  
  results: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusion: number[][];
  } = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    confusion: [[0, 0], [0, 0]]
  };

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.subscription = this.datasetService.dataset$.subscribe(ds => {
      this.dataset = ds;
      if (ds) {
        this.numericColumns = ds.headers
          .map((_, i) => i)
          .filter(i => typeof ds.rows[0][i] === 'number');
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  runClassifier() {
    if (!this.selectedClassifier || !this.targetColumn) return;
    
    // placeholder: add logic for Decision Tree, k-NN, etc.
    this.results = {
      accuracy: 0.95,
      precision: 0.92,
      recall: 0.94,
      f1Score: 0.93,
      confusion: [
        [50, 5],
        [3, 42]
      ]
    };
    this.activeTab = 'results';
  }

  selectClassifier(classifier: string) {
    this.selectedClassifier = classifier;
  }
}
