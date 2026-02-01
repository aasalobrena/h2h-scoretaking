type ActivityCode = string;
interface Activity {
  id: number;
  name: string;
  activityCode: ActivityCode;
  startTime: string;
  endTime: string;
  childActivities: Activity[];
  scrambleSetId?: number | null;
  extensions: Extension[];
}
