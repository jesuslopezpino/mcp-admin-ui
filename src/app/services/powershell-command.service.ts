import { Injectable } from '@angular/core';
import { Asset } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PowerShellCommandService {

  generateCommand(toolName: string, formValue: any, selectedAsset?: Asset): string {
    // Set encoding for proper output
    let command = '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ';
    
    // Add target information if remote
    if (selectedAsset) {
      const target = selectedAsset.hostname || selectedAsset.ip;
      command += `Write-Host '=== EJECUTANDO EN SISTEMA REMOTO: ${target} ==='; `;
    } else {
      command += `Write-Host '=== EJECUTANDO EN SISTEMA LOCAL ==='; `;
    }
    
    // Generate specific command based on tool name
    switch (toolName) {
      case 'user.list_users':
        return this.generateUserListCommand(command, selectedAsset);
        
      case 'user.create_user':
        return this.generateUserCreateCommand(command, formValue, selectedAsset);
        
      case 'user.delete_user':
        return this.generateUserDeleteCommand(command, formValue, selectedAsset);
        
      case 'user.unlock_user':
        return this.generateUserUnlockCommand(command, formValue, selectedAsset);
        
      case 'user.add_to_group':
        return this.generateUserAddToGroupCommand(command, formValue, selectedAsset);
        
      case 'user.remove_from_group':
        return this.generateUserRemoveFromGroupCommand(command, formValue, selectedAsset);
        
      case 'user.get_active_sessions':
        return this.generateUserGetActiveSessionsCommand(command, selectedAsset);
        
      case 'user.logoff_user':
        return this.generateUserLogoffCommand(command, formValue, selectedAsset);
        
      case 'system.get_system_info':
        return this.generateSystemInfoCommand(command, selectedAsset);
        
      case 'system.get_performance':
        return this.generateSystemPerformanceCommand(command, selectedAsset);
        
      case 'system.get_disk_info':
        return this.generateSystemDiskInfoCommand(command, selectedAsset);
        
      case 'system.get_installed_programs':
        return this.generateSystemInstalledProgramsCommand(command, selectedAsset);
        
      case 'system.get_services':
        return this.generateSystemServicesCommand(command, selectedAsset);
        
      case 'system.remote_reboot':
        return this.generateSystemRebootCommand(command, selectedAsset);
        
      case 'system.remote_shutdown':
        return this.generateSystemShutdownCommand(command, selectedAsset);
        
      case 'system.cleanup_disk':
        return this.generateSystemCleanupCommand(command);
        
      case 'network.ping_host':
        return this.generateNetworkPingCommand(command, formValue);
        
      case 'network.flush_dns':
        return this.generateNetworkFlushDnsCommand(command);
        
      case 'network.reset_winsock':
        return this.generateNetworkResetWinsockCommand(command);
        
      case 'security.enable_firewall':
        return this.generateSecurityEnableFirewallCommand(command);
        
      case 'security.check_firewall':
        return this.generateSecurityCheckFirewallCommand(command);
        
      case 'security.scan_malware':
        return this.generateSecurityScanMalwareCommand(command);
        
      case 'process.get_processes':
        return this.generateProcessGetProcessesCommand(command, selectedAsset);
        
      case 'process.kill_process':
        return this.generateProcessKillCommand(command, formValue);
        
      case 'process.suspend_process':
        return this.generateProcessSuspendCommand(command, formValue);
        
      case 'process.resume_process':
        return this.generateProcessResumeCommand(command, formValue);
        
      case 'files.get_directory_contents':
        return this.generateFilesGetDirectoryCommand(command, formValue);
        
      case 'files.delete_file':
        return this.generateFilesDeleteCommand(command, formValue);
        
      case 'files.copy_file':
        return this.generateFilesCopyCommand(command, formValue);
        
      case 'update.install_updates':
        return this.generateUpdateInstallCommand(command);
        
      case 'update.check_updates':
        return this.generateUpdateCheckCommand(command);
        
      default:
        return this.generateGenericCommand(command, toolName, formValue, selectedAsset);
    }
  }

  private generateUserListCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_UserAccount -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | `;
      command += `Where-Object {$_.LocalAccount -eq $true} | `;
      command += `Select-Object Name, FullName, Description, Disabled, Lockout, PasswordRequired | `;
      command += `Format-Table -AutoSize;`;
    } else {
      command += `Get-LocalUser | Select-Object Name, FullName, Description, Enabled, PasswordRequired | Format-Table -AutoSize;`;
    }
    return command;
  }

  private generateUserCreateCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const username = formValue['username'] || 'nuevo_usuario';
    const password = formValue['password'] || 'TempPass123!';
    const fullName = formValue['fullName'] || '';
    const description = formValue['description'] || '';
    
    if (selectedAsset) {
      command += `try { `;
      command += `$user = Get-WmiObject -Class Win32_UserAccount -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Where-Object {$_.Name -eq '${username}'}; `;
      command += `if ($user) { Write-Host 'Usuario ${username} ya existe' } else { `;
      command += `$computer = [ADSI]"WinNT://${selectedAsset.hostname || selectedAsset.ip}"; `;
      command += `$user = $computer.Create('user', '${username}'); `;
      command += `$user.SetPassword('${password}'); `;
      command += `$user.SetInfo(); `;
      command += `Write-Host 'Usuario ${username} creado exitosamente' `;
      command += `} } catch { Write-Host 'Error: ' + $_.Exception.Message };`;
    } else {
      command += `try { `;
      command += `New-LocalUser -Name '${username}' -Password (ConvertTo-SecureString '${password}' -AsPlainText -Force)`;
      if (fullName) command += ` -FullName '${fullName}'`;
      if (description) command += ` -Description '${description}'`;
      command += ` -ErrorAction Stop; `;
      command += `Write-Host 'Usuario ${username} creado exitosamente' `;
      command += `} catch { Write-Host 'Error: ' + $_.Exception.Message };`;
    }
    return command;
  }

  private generateUserDeleteCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const userToDelete = formValue['username'] || '';
    if (userToDelete) {
      if (selectedAsset) {
        command += `try { `;
        command += `$user = Get-WmiObject -Class Win32_UserAccount -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Where-Object {$_.Name -eq '${userToDelete}'}; `;
        command += `if ($user) { $user.Delete(); Write-Host 'Usuario ${userToDelete} eliminado exitosamente' } else { Write-Host 'Usuario ${userToDelete} no encontrado' } `;
        command += `} catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      } else {
        command += `try { Remove-LocalUser -Name '${userToDelete}' -ErrorAction Stop; Write-Host 'Usuario ${userToDelete} eliminado exitosamente' } catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      }
    }
    return command;
  }

  private generateUserUnlockCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const userToUnlock = formValue['username'] || '';
    if (userToUnlock) {
      if (selectedAsset) {
        command += `try { `;
        command += `$user = Get-WmiObject -Class Win32_UserAccount -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Where-Object {$_.Name -eq '${userToUnlock}'}; `;
        command += `if ($user) { $user.Unlock(); Write-Host 'Usuario ${userToUnlock} desbloqueado exitosamente' } else { Write-Host 'Usuario ${userToUnlock} no encontrado' } `;
        command += `} catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      } else {
        command += `try { Unlock-LocalUser -Name '${userToUnlock}' -ErrorAction Stop; Write-Host 'Usuario ${userToUnlock} desbloqueado exitosamente' } catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      }
    }
    return command;
  }

  private generateUserAddToGroupCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const userForGroup = formValue['username'] || '';
    const groupName = formValue['groupName'] || '';
    if (userForGroup && groupName) {
      if (selectedAsset) {
        command += `try { `;
        command += `$group = Get-WmiObject -Class Win32_Group -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Where-Object {$_.Name -eq '${groupName}'}; `;
        command += `if ($group) { $group.AddMember('WinNT://${selectedAsset.hostname || selectedAsset.ip}/${userForGroup}'); Write-Host 'Usuario ${userForGroup} agregado al grupo ${groupName}' } else { Write-Host 'Grupo ${groupName} no encontrado' } `;
        command += `} catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      } else {
        command += `try { Add-LocalGroupMember -Group '${groupName}' -Member '${userForGroup}' -ErrorAction Stop; Write-Host 'Usuario ${userForGroup} agregado al grupo ${groupName}' } catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      }
    }
    return command;
  }

  private generateUserRemoveFromGroupCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const userFromGroup = formValue['username'] || '';
    const groupToRemove = formValue['groupName'] || '';
    if (userFromGroup && groupToRemove) {
      if (selectedAsset) {
        command += `try { `;
        command += `$group = Get-WmiObject -Class Win32_Group -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Where-Object {$_.Name -eq '${groupToRemove}'}; `;
        command += `if ($group) { $group.RemoveMember('WinNT://${selectedAsset.hostname || selectedAsset.ip}/${userFromGroup}'); Write-Host 'Usuario ${userFromGroup} removido del grupo ${groupToRemove}' } else { Write-Host 'Grupo ${groupToRemove} no encontrado' } `;
        command += `} catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      } else {
        command += `try { Remove-LocalGroupMember -Group '${groupToRemove}' -Member '${userFromGroup}' -ErrorAction Stop; Write-Host 'Usuario ${userFromGroup} removido del grupo ${groupToRemove}' } catch { Write-Host 'Error: ' + $_.Exception.Message };`;
      }
    }
    return command;
  }

  private generateUserGetActiveSessionsCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `try { `;
      command += `$sessions = Get-WmiObject -Class Win32_LogonSession -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' -ErrorAction Stop; `;
      command += `$sessions | Where-Object {$_.LogonType -eq 2 -or $_.LogonType -eq 10} | `;
      command += `ForEach-Object { `;
      command += `$user = $_.GetRelated('Win32_UserAccount'); `;
      command += `$startTime = [System.Management.ManagementDateTimeConverter]::ToDateTime($_.StartTime); `;
      command += `[PSCustomObject]@{ `;
      command += `Usuario = $user.Name; `;
      command += `Dominio = $user.Domain; `;
      command += `TipoSesion = $_.LogonType; `;
      command += `HoraInicio = $startTime; `;
      command += `IDSesion = $_.LogonId `;
      command += `} `;
      command += `} | Format-Table -AutoSize; `;
      command += `} catch { Write-Host 'Error de conectividad WMI: ' + $_.Exception.Message };`;
    } else {
      command += `quser;`;
    }
    return command;
  }

  private generateUserLogoffCommand(command: string, formValue: any, selectedAsset?: Asset): string {
    const userToLogoff = formValue['username'] || '';
    if (userToLogoff) {
      if (selectedAsset) {
        command += `try { `;
        command += `$sessions = Get-WmiObject -Class Win32_LogonSession -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' -ErrorAction Stop; `;
        command += `$sessionIds = $sessions | Where-Object {$_.LogonType -eq 2 -or $_.LogonType -eq 10} | ForEach-Object { $_.LogonId }; `;
        command += `if ($sessionIds) { $sessionIds | ForEach-Object { try { logoff $_; Write-Host 'Sesión cerrada: ' + $_ } catch { Write-Host 'Error cerrando sesión ' + $_ + ': ' + $_.Exception.Message } } } else { Write-Host 'No se encontraron sesiones interactivas' }; `;
        command += `} catch { Write-Host 'Error de conectividad WMI: ' + $_.Exception.Message };`;
      } else {
        command += `logoff;`;
      }
    }
    return command;
  }

  private generateSystemInfoCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_OperatingSystem -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | `;
      command += `Select-Object Caption, Version, OSArchitecture, TotalVisibleMemorySize, FreePhysicalMemory | `;
      command += `Format-List;`;
    } else {
      command += `Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, AvailablePhysicalMemory | Format-List;`;
    }
    return command;
  }

  private generateSystemPerformanceCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_PerfRawData_PerfOS_Processor -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | `;
      command += `Select-Object Name, PercentProcessorTime | Format-Table -AutoSize;`;
    } else {
      command += `Get-Counter -Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 1 | Format-Table;`;
    }
    return command;
  }

  private generateSystemDiskInfoCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_LogicalDisk -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Select-Object DeviceID, Size, FreeSpace, @{Name='PercentFree';Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}} | Format-Table -AutoSize;`;
    } else {
      command += `Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace, @{Name='PercentFree';Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}} | Format-Table -AutoSize;`;
    }
    return command;
  }

  private generateSystemInstalledProgramsCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_Product -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Select-Object Name, Version, Vendor | Format-Table -AutoSize;`;
    } else {
      command += `Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor | Format-Table -AutoSize;`;
    }
    return command;
  }

  private generateSystemServicesCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-WmiObject -Class Win32_Service -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Select-Object Name, State, StartMode | Format-Table -AutoSize;`;
    } else {
      command += `Get-Service | Select-Object Name, Status, StartType | Format-Table -AutoSize;`;
    }
    return command;
  }

  private generateSystemRebootCommand(command: string, selectedAsset?: Asset): string {
    const rebootTarget = selectedAsset ? (selectedAsset.hostname || selectedAsset.ip) : 'localhost';
    command += `Restart-Computer -ComputerName '${rebootTarget}' -Force -Wait; Write-Host 'Sistema ${rebootTarget} reiniciado exitosamente';`;
    return command;
  }

  private generateSystemShutdownCommand(command: string, selectedAsset?: Asset): string {
    const shutdownTarget = selectedAsset ? (selectedAsset.hostname || selectedAsset.ip) : 'localhost';
    command += `Stop-Computer -ComputerName '${shutdownTarget}' -Force; Write-Host 'Sistema ${shutdownTarget} apagado exitosamente';`;
    return command;
  }

  private generateSystemCleanupCommand(command: string): string {
    command += `Cleanmgr /sagerun:1; Write-Host 'Limpieza de disco iniciada';`;
    return command;
  }

  private generateNetworkPingCommand(command: string, formValue: any): string {
    const hostToPing = formValue['hostname'] || formValue['ip'] || '';
    if (hostToPing) {
      command += `Test-Connection -ComputerName '${hostToPing}' -Count 4 -ErrorAction Stop;`;
    }
    return command;
  }

  private generateNetworkFlushDnsCommand(command: string): string {
    command += `ipconfig /flushdns; Write-Host 'Cache DNS limpiado exitosamente';`;
    return command;
  }

  private generateNetworkResetWinsockCommand(command: string): string {
    command += `netsh winsock reset; Write-Host 'Winsock resetado exitosamente';`;
    return command;
  }

  private generateSecurityEnableFirewallCommand(command: string): string {
    command += `Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True; Write-Host 'Firewall habilitado para todos los perfiles';`;
    return command;
  }

  private generateSecurityCheckFirewallCommand(command: string): string {
    command += `Get-NetFirewallProfile | Select-Object Name, Enabled | Format-Table -AutoSize;`;
    return command;
  }

  private generateSecurityScanMalwareCommand(command: string): string {
    command += `Start-MpScan -ScanType QuickScan; Write-Host 'Escaneo de malware iniciado';`;
    return command;
  }

  private generateProcessGetProcessesCommand(command: string, selectedAsset?: Asset): string {
    if (selectedAsset) {
      command += `Get-Process -ComputerName '${selectedAsset.hostname || selectedAsset.ip}' | Select-Object Name, Id, CPU, WorkingSet | Sort-Object CPU -Descending | Select-Object -First 20 | Format-Table -AutoSize;`;
    } else {
      command += `Get-Process | Select-Object Name, Id, CPU, WorkingSet | Sort-Object CPU -Descending | Select-Object -First 20 | Format-Table -AutoSize;`;
    }
    return command;
  }

  private generateProcessKillCommand(command: string, formValue: any): string {
    const processId = formValue['processId'] || '';
    if (processId) {
      command += `Stop-Process -Id ${processId} -Force; Write-Host 'Proceso ${processId} terminado exitosamente';`;
    }
    return command;
  }

  private generateProcessSuspendCommand(command: string, formValue: any): string {
    const processToSuspend = formValue['processId'] || '';
    if (processToSuspend) {
      command += `Suspend-Process -Id ${processToSuspend}; Write-Host 'Proceso ${processToSuspend} suspendido exitosamente';`;
    }
    return command;
  }

  private generateProcessResumeCommand(command: string, formValue: any): string {
    const processToResume = formValue['processId'] || '';
    if (processToResume) {
      command += `Resume-Process -Id ${processToResume}; Write-Host 'Proceso ${processToResume} reanudado exitosamente';`;
    }
    return command;
  }

  private generateFilesGetDirectoryCommand(command: string, formValue: any): string {
    const directoryPath = formValue['path'] || 'C:\\';
    command += `Get-ChildItem -Path '${directoryPath}' | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize;`;
    return command;
  }

  private generateFilesDeleteCommand(command: string, formValue: any): string {
    const fileToDelete = formValue['path'] || '';
    if (fileToDelete) {
      command += `Remove-Item -Path '${fileToDelete}' -Force; Write-Host 'Archivo ${fileToDelete} eliminado exitosamente';`;
    }
    return command;
  }

  private generateFilesCopyCommand(command: string, formValue: any): string {
    const sourceFile = formValue['source'] || '';
    const destFile = formValue['destination'] || '';
    if (sourceFile && destFile) {
      command += `Copy-Item -Path '${sourceFile}' -Destination '${destFile}' -Force; Write-Host 'Archivo copiado de ${sourceFile} a ${destFile}';`;
    }
    return command;
  }

  private generateUpdateInstallCommand(command: string): string {
    command += `Get-WindowsUpdate -AcceptAll -Install -AutoReboot; Write-Host 'Actualizaciones instaladas exitosamente';`;
    return command;
  }

  private generateUpdateCheckCommand(command: string): string {
    command += `Get-WindowsUpdate; Write-Host 'Verificación de actualizaciones completada';`;
    return command;
  }

  private generateGenericCommand(command: string, toolName: string, formValue: any, selectedAsset?: Asset): string {
    command += `# Comando específico para: ${toolName}\n`;
    command += `# Este comando se ejecutará en el backend con los parámetros proporcionados\n`;
    if (selectedAsset) {
      command += `# Target: ${selectedAsset.hostname || selectedAsset.ip}\n`;
    }
    if (Object.keys(formValue).length > 0) {
      command += `# Parámetros: ${JSON.stringify(formValue, null, 2)}\n`;
    }
    return command;
  }
}
