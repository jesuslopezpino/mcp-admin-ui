import { Component, Input, OnInit, OnChanges } from '@angular/core';


@Component({
    selector: 'app-terminal-output',
    imports: [],
    templateUrl: './terminal-output.component.html',
    styleUrls: ['./terminal-output.component.css']
})
export class TerminalOutputComponent implements OnInit, OnChanges {
  @Input() stdout: string = '';
  @Input() stderr: string = '';
  @Input() exitCode: number = 0;
  @Input() status: string = '';
  @Input() targetHostname: string = '';
  @Input() targetIp: string = '';
  @Input() commandName: string = '';
  @Input() executionId?: string;

  formattedOutput: string = '';
  isSuccess: boolean = false;
  isFullscreen: boolean = false;
  isTruncated: boolean = false;
  showFullOutput: boolean = false;
  private readonly MAX_CHARS = 500;

  ngOnInit() {
    this.formatOutput();
  }

  ngOnChanges() {
    this.formatOutput();
    
    // Auto-fullscreen when execution is successful
    if (this.isSuccess && this.formattedOutput && this.formattedOutput.trim()) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        this.isFullscreen = true;
      }, 100);
    }
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
    
    // Check if output should be truncated
    this.isTruncated = this.formattedOutput.length > this.MAX_CHARS;
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
    // Create content with metadata
    const metadata = [
      '='.repeat(50),
      'MCP Execution Output',
      '='.repeat(50),
      `Tool: ${this.commandName || 'Unknown'}`,
      `Execution ID: ${this.executionId || 'N/A'}`,
      `Target: ${this.getTargetDisplayName()}`,
      `Status: ${this.status}`,
      `Exit Code: ${this.exitCode}`,
      `Date: ${new Date().toISOString()}`,
      '='.repeat(50),
      '',
      '--- STDOUT ---',
      this.stdout || '(empty)',
      '',
      '--- STDERR ---',
      this.stderr || '(empty)',
      ''
    ].join('\n');

    const blob = new Blob([metadata], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = this.commandName 
      ? `${this.commandName.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
      : `terminal-output-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  toggleOutput() {
    this.showFullOutput = !this.showFullOutput;
  }

  getDisplayOutput(): string {
    if (this.showFullOutput || !this.isTruncated) {
      return this.formattedOutput;
    }
    return this.formattedOutput.substring(0, this.MAX_CHARS) + '\n...[truncated]...';
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  closeFullscreen() {
    this.isFullscreen = false;
  }

  getTargetDisplayName(): string {
    if (this.targetHostname) {
      return `${this.targetHostname} (${this.targetIp})`;
    }
    return this.targetIp || 'Servidor local';
  }

  getCommandDisplayName(): string {
    return this.commandName || 'Comando ejecutado';
  }
}
