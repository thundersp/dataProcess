import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Dataset {
  fileName: string;
  headers: string[];
  rows: (number | string)[][];
}

@Injectable({
  providedIn: 'root' // available globally
})
export class DatasetService {
  private datasetSubject = new BehaviorSubject<Dataset | null>(null);
  dataset$ = this.datasetSubject.asObservable();

  setDataset(dataset: Dataset) {
    this.datasetSubject.next(dataset);
  }

  getDataset(): Dataset | null {
    return this.datasetSubject.value;
  }
}
