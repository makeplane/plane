
const BASE_URL = process.env.NEXT_PUBLIC_CP_SERVER_URL!;

export interface Template {
  field: string;
  type: number;
}

export class AdapterService {
  templateMap: Record<string, Record<string, number>> = {};

  //-------------------------
  // READ()
  //-------------------------
  async read(endpoint: string) {
    const res = await fetch(`${BASE_URL}/${endpoint}`);
    if (!res.ok) throw new Error(`Failed to read: ${endpoint}`);
    return res.json();
  }

  //-------------------------
  // cppToNg()
  //-------------------------
  cppToNg(cppObj: { field: string; type: number; value: any }[]) {
    const ngObj: any = {};

    for (const obj of cppObj) {
      if (obj.type === 6) {
        // array: recurse
        ngObj[obj.field] = obj.value.map((item: any) =>
          this.cppToNg(item)
        );
      } else {
        ngObj[obj.field] = obj.value;
      }
    }

    return ngObj;
  }

  //-------------------------
  // getTemplateMap()
  //-------------------------
  async getTemplateMap(resource: string) {
    // cache
    if (this.templateMap[resource]) {
      return this.templateMap[resource];
    }

    // FIX #1: hyphen -> underscore (Angular behavior)
    const fixed = resource.includes("-")
      ? resource.replace(/-/g, "_")
      : resource;

    // FIX #2: correct backend URL
    const tmpl = await this.read(`${fixed}/template`);

    const templObj: Record<string, number> = {};

    for (const elem of tmpl["Gateway Response"]) {
      templObj[elem.field] = elem.type;
    }

    // save cache
    this.templateMap[resource] = templObj;

    return templObj;
  }

  //-------------------------
  // ngToCpp()
  //-------------------------
  async ngToCpp(
    ngObj: Record<string, any>,
    resource: string
  ): Promise<{ field: string; type: number; value: any }[]> {
    const template = await this.getTemplateMap(resource);

    const cppObj = [];

    for (const key of Object.keys(ngObj)) {
      if (key === "id") continue;

      cppObj.push({
        field: key,
        type: template[key],
        value: ngObj[key],
      });
    }

    return cppObj;
  }

  //-------------------------
  // demodulate()
  //-------------------------
  async demodulate(type: string, dataPromise: Promise<any>) {
    const blob = await dataPromise;
    const result = blob?.["Gateway Response"]?.result || [];
    return result.map((cpp: any) => this.cppToNg(cpp));
  }

  //-------------------------
  // modulate()
  //-------------------------
  async modulate(type: string, data: any[]) {
    const all = await Promise.all(data.map((x) => this.ngToCpp(x, type)));
    return all;
  }

  //-------------------------
  // modulateOne()
  //-------------------------
  async modulateOne(type: string, data: any) {
    // FIX #3: hyphen → underscore for backend table name
    const fixedType = type.includes("-")
      ? type.replace(/-/g, "_")
      : type;

    const cols = await this.ngToCpp(data, type);

    return {
      table: fixedType,
      columns: cols,
      criteria: [{ field: "id", value: data["id"] }],
    };
  }
}

export const adapter = new AdapterService();
