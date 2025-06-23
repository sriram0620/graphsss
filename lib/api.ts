export interface Template {
  template_name: string[];
  default: boolean[];
  template_id: string[];
  template_desc: string[];
  favorite: boolean[];
}

export interface TemplateDetail {
  user_id: string;
  template_id: string;
  template_name: string;
  template_desc: string;
  default: boolean;
  favorite: boolean;
  frequency: string;
  resolution: string;
  systems: Array<{
    system_id: string;
  }>;
  graphs: Array<{
    graph_id: string;
    graph_name: string;
    top_xy_pos: string;
    bottom_xy_pos: string;
    primary_kpi_id: string;
    secondary_kpis: Array<{
      kpi_id: string;
    }>;
    frequency: string;
    resolution: string;
    graph_type: 'line' | 'bar';
  }>;
}

export interface KPIData {
  timestamp: string;
  kpi_value?: number;
  job_count?: number;
}

export interface KPIInfo {
  kpi_name: string;
  kpi_group: string;
}

const BASE_URL = "https://shwsckbvbt.a.pinggy.link";

export class ApiService {
  private static kpiInfoCache: Map<string, KPIInfo[]> = new Map();

  static async fetchTemplates(userId: string = "USER_TEST_1"): Promise<Template[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/utl?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  static async fetchTemplateDetail(templateId: string): Promise<TemplateDetail[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/ut?templateId=${templateId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch template detail: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching template detail:', error);
      throw error;
    }
  }

  static async fetchKPIInfoByGroup(kpiGroup: string): Promise<KPIInfo[]> {
    try {
      // Check cache first
      if (this.kpiInfoCache.has(kpiGroup)) {
        return this.kpiInfoCache.get(kpiGroup)!;
      }

      const response = await fetch(`${BASE_URL}/api/kpi?kpi_grp=${kpiGroup.toUpperCase()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI info for group ${kpiGroup}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match our interface
      const kpiInfo: KPIInfo[] = data.map((item: any) => ({
        kpi_name: item.kpi_name,
        kpi_group: kpiGroup.toLowerCase()
      }));

      // Cache the result
      this.kpiInfoCache.set(kpiGroup, kpiInfo);
      
      return kpiInfo;
    } catch (error) {
      console.error(`Error fetching KPI info for group ${kpiGroup}:`, error);
      throw error;
    }
  }

  static async fetchAllKPIInfo(): Promise<KPIInfo[]> {
    try {
      // Fetch KPI info for both OS and Jobs groups
      const [osKpis, jobKpis] = await Promise.all([
        this.fetchKPIInfoByGroup('OS'),
        this.fetchKPIInfoByGroup('JOBS')
      ]);

      // Combine both groups
      return [...osKpis, ...jobKpis];
    } catch (error) {
      console.error('Error fetching all KPI info:', error);
      throw error;
    }
  }

  static async fetchOSKPIData(
    kpiName: string,
    from: string,
    to: string,
    aggregation: string = "60s"
  ): Promise<KPIData[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/os2?kpi_name=${kpiName}&from=${from}&to=${to}&aggregation=${aggregation}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch OS KPI data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching OS KPI data:', error);
      throw error;
    }
  }

  static async fetchJobKPIData(
    kpiName: string,
    from: string,
    to: string,
    aggregation: string = "10m"
  ): Promise<KPIData[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/jobs?kpi_name=${kpiName}&from=${from}&to=${to}&aggregation=${aggregation}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Job KPI data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Job KPI data:', error);
      throw error;
    }
  }

  static getKPIGroup(kpiName: string, kpiInfoList: KPIInfo[]): string {
    const kpiInfo = kpiInfoList.find(kpi => kpi.kpi_name === kpiName);
    return kpiInfo?.kpi_group || 'os'; // default to 'os' if not found
  }

  static async fetchKPIData(
    kpiName: string,
    kpiGroup: string,
    from: string,
    to: string,
    aggregation?: string
  ): Promise<KPIData[]> {
    if (kpiGroup.toLowerCase() === 'jobs') {
      return this.fetchJobKPIData(kpiName, from, to, aggregation || "10m");
    } else {
      return this.fetchOSKPIData(kpiName, from, to, aggregation || "60s");
    }
  }

  // Helper method to get KPI group for a specific KPI name
  static async getKPIGroupDynamic(kpiName: string): Promise<string> {
    try {
      // Try to find in OS KPIs first
      const osKpis = await this.fetchKPIInfoByGroup('OS');
      const osKpi = osKpis.find(kpi => kpi.kpi_name === kpiName);
      if (osKpi) {
        return 'os';
      }

      // Try to find in Jobs KPIs
      const jobKpis = await this.fetchKPIInfoByGroup('JOBS');
      const jobKpi = jobKpis.find(kpi => kpi.kpi_name === kpiName);
      if (jobKpi) {
        return 'jobs';
      }

      // Default to OS if not found
      console.warn(`KPI ${kpiName} not found in any group, defaulting to OS`);
      return 'os';
    } catch (error) {
      console.error(`Error determining KPI group for ${kpiName}:`, error);
      return 'os'; // Default fallback
    }
  }
}