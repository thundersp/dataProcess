import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadComponent } from './components/upload/upload.component';
import { PreprocessingComponent } from './components/preprocessing/preprocessing.component';
import { VisualizationComponent } from './components/visualization/visualization.component';
import { ClassificationComponent } from './components/classification/classification.component';
import { CommonModule } from '@angular/common';
import { DatasetService } from './services/dataset.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, UploadComponent, PreprocessingComponent, VisualizationComponent, ClassificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dataProcess';
  activeTab: 'upload' | 'preprocessing' | 'classification' | 'visualization' = 'upload';
  hasDataset: boolean = false;
  private subscription: Subscription | null = null;

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.subscription = this.datasetService.dataset$.subscribe(dataset => {
      this.hasDataset = !!dataset;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
