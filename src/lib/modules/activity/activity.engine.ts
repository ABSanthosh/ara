/**
 * Things this engine should do:
 * - Audio tracking: 
 *    - Continues tracking if tab is playing audio, even when user is "idle"
 *    - Checks activeTab.audible property
 * - Uses Chrome's idle API with configurable inactivity thresholds:
 *    - Default: 30 seconds
 *    - other custimizable durations
 * - Data retention policies:
 *    - Default: 30 days
 *    - User-configurable retention periods
 *    - Automatic purging of old data beyond retention period
 * 
*/

export class ActivityEngineImpl {

  constructor(){

  }
}