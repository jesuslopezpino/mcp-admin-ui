import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terminal-output',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal-output.component.html',
  styleUrls: ['./terminal-output.component.css']
})
export class TerminalOutputComponent implements OnInit, OnChanges {
  @Input() stdout: string = '';
  @Input() stderr: string = '';
  @Input() exitCode: number = 0;
  @Input() status: string = '';

  formattedOutput: string = '';
  isSuccess: boolean = false;
  isFullscreen: boolean = false;

  ngOnInit() {
    this.formatOutput();
  }

  ngOnChanges() {
    this.formatOutput();
  }

  private formatOutput() {
    this.isSuccess = this.exitCode === 0 && this.status === 'SUCCESS';
    
    // Combine stdout and stderr
    let output = this.stdout;
    if (this.stderr && this.stderr.trim()) {
      output += '\n' + this.stderr;
    }

    // Format the output with proper line breaks and styling
    this.formattedOutput = output
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => {
        // Add terminal prompt for certain lines
        if (line.includes('===') && line.includes('===')) {
          return `$ ${line}`;
        }
        if (line.startsWith('winget')) {
          return `$ ${line}`;
        }
        if (line.startsWith('Write-Host')) {
          return `$ ${line}`;
        }
        return line;
      })
      .join('\n');
  }

  getStatusColor(): string {
    if (this.isSuccess) {
      return '#4CAF50'; // Green
    } else {
      return '#F44336'; // Red
    }
  }

  getStatusIcon(): string {
    return this.isSuccess ? '✓' : '✗';
  }

  copyToClipboard() {
    const textToCopy = this.formattedOutput;
    navigator.clipboard.writeText(textToCopy).then(() => {
      // You could add a toast notification here
      console.log('Output copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  downloadOutput() {
    const blob = new Blob([this.formattedOutput], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terminal-output-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  closeFullscreen() {
    this.isFullscreen = false;
  }
}
