export interface LmsTopic {
  id: number;
  title: string;
  engine_topic_id: string | null;
  isUnlocked: boolean;
}

export interface LmsModule {
  id: number;
  title: string;
  status: 'active' | 'paused';
  topics: LmsTopic[];
}
