import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatasetService, Dataset } from '../../services/dataset.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  numericColumns: string[] = [];
  categoricalColumns: string[] = [];
  dataPreview: (number | string)[][] = [];
  hasData: boolean = false;

  constructor(private datasetService: DatasetService) {}

  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      const dataset = this.parseCSV(text, file.name);
      this.analyzeColumns(dataset);
      this.dataPreview = dataset.rows.slice(0, 10);
      this.hasData = true;
      this.datasetService.setDataset(dataset);
    };

    reader.readAsText(file);
  }

  parseCSV(csvText: string, fileName: string): Dataset {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: (number | string)[][] = lines.slice(1).map(line => {
      return line.split(',').map(value => {
        const num = parseFloat(value);
        return isNaN(num) ? value.trim() : num;
      });
    });
    return { fileName, headers, rows };
  }

  private analyzeColumns(dataset: Dataset) {
    this.numericColumns = [];
    this.categoricalColumns = [];
    
    dataset.headers.forEach((header, index) => {
      const isNumeric = dataset.rows.every(row => 
        typeof row[index] === 'number' || !isNaN(parseFloat(row[index] as string))
      );
      
      if (isNumeric) {
        this.numericColumns.push(header);
      } else {
        this.categoricalColumns.push(header);
      }
    });
  }
}
