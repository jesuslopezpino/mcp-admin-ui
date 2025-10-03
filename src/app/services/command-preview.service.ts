import { Injectable } from '@angular/core';
import { ToolDetails, Asset } from './api.service';
import { PowerShellCommandService } from './powershell-command.service';

@Injectable({
  providedIn: 'root'
})
export class CommandPreviewService {

  constructor(private powershellCommandService: PowerShellCommandService) {}

  generatePreview(tool: ToolDetails, formValue: any, selectedAsset?: Asset): string {
    const targetInfo = selectedAsset ? 
      `${selectedAsset.hostname || selectedAsset.ip} (${selectedAsset.ip})` : 
      'Servidor local';

    // Generate a preview of the command that would be executed
    let commandPreview = `# Previsualización del comando: ${tool.name}\n`;
    commandPreview += `# Destino: ${targetInfo}\n`;
    commandPreview += `# Descripción: ${tool.description}\n`;
    commandPreview += `# Requiere confirmación: ${tool.requiresConfirmation ? 'Sí' : 'No'}\n`;
    
    // Add form parameters
    const hasParameters = Object.keys(formValue).some(key => {
      const value = formValue[key];
      return value !== null && value !== undefined && value !== '';
    });
    
    if (hasParameters) {
      commandPreview += `# Parámetros:\n`;
      Object.keys(formValue).forEach(key => {
        const value = formValue[key];
        if (value !== null && value !== undefined && value !== '') {
          commandPreview += `#   ${key}: ${value}\n`;
        }
      });
    } else {
      commandPreview += `# Sin parámetros adicionales\n`;
    }
    
    commandPreview += `\n# Comando PowerShell que se ejecutará:\n`;
    
    // Use the command from the backend if available, otherwise fallback to local generation
    if (tool.command) {
      // Replace placeholders in the command with actual values
      let actualCommand = tool.command;
      
      // Add target information if remote execution
      if (selectedAsset) {
        const target = selectedAsset.hostname || selectedAsset.ip;
        actualCommand = actualCommand.replace('{targetHostname}', target);
        actualCommand = actualCommand.replace('{targetIp}', selectedAsset.ip);
      }
      
      // Replace form parameters
      Object.keys(formValue).forEach(key => {
        const value = formValue[key];
        if (value !== null && value !== undefined && value !== '') {
          actualCommand = actualCommand.replace(`{${key}}`, value.toString());
        }
      });
      
      commandPreview += actualCommand;
    } else {
      // Fallback to local generation if no command from backend
      const actualCommand = this.powershellCommandService.generateCommand(tool.name, formValue, selectedAsset);
      commandPreview += actualCommand;
    }

    return commandPreview;
  }
}
