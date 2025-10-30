// components/TermuxBridge.tsx
import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TermuxBridge {
  private isTermuxAvailable: boolean = false;

  async checkTermuxAvailability(): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL('termux://');
      this.isTermuxAvailable = canOpen;
      return canOpen;
    } catch (error) {
      this.isTermuxAvailable = false;
      return false;
    }
  }

  async executeCommand(command: string): Promise<string> {
    if (!this.isTermuxAvailable) {
      throw new Error('Termux not available. Please install Termux from F-Droid.');
    }

    try {
      // Store command in AsyncStorage for Termux to read
      const commandId = Date.now().toString();
      await AsyncStorage.setItem(`termux_cmd_${commandId}`, JSON.stringify({
        command,
        timestamp: new Date().toISOString()
      }));

      // Launch Termux with our command
      const termuxUrl = `termux://run-command?cmd=am broadcast -a net.dinglish.tasker.termux.RUN_COMMAND --es id ${commandId} --ez termux_api true`;
      await Linking.openURL(termuxUrl);

      // Wait for response (you'd need to implement polling)
      return await this.waitForCommandResult(commandId);
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  private async waitForCommandResult(commandId: string): Promise<string> {
    // Poll for result (simplified implementation)
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await AsyncStorage.getItem(`termux_result_${commandId}`);
        resolve(result || 'Command executed (no output captured)');
      }, 2000);
    });
  }

  // Common Termux API commands
  async shareFile(filePath: string): Promise<void> {
    await Linking.openURL(`termux-share://${filePath}`);
  }

  async showToast(message: string): Promise<void> {
    await Linking.openURL(`termux-toast://${encodeURIComponent(message)}`);
  }

  async vibrate(duration: number = 300): Promise<void> {
    await Linking.openURL(`termux-vibrate://?duration=${duration}`);
  }

  async getBatteryInfo(): Promise<string> {
    return await this.executeCommand('termux-battery-status');
  }

  async getDeviceInfo(): Promise<string> {
    return await this.executeCommand('termux-info');
  }
}

export default new TermuxBridge();