import isEqual from "lodash/isEqual";
import merge from "lodash/merge";
import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { DEFAULT_FILTER_CONFIG_OPTIONS, TConfigOptions } from "@plane/constants";
import { TFilterConfig } from "@plane/types";
// local imports
import { IFilterInstance } from "./filter";

export interface IFilterConfigManager<FilterPropertyKey extends string> {
  // observables
  filterConfigs: Map<FilterPropertyKey, TFilterConfig<FilterPropertyKey>>;
  configOptions: TConfigOptions;
  // computed
  allConfigs: TFilterConfig<FilterPropertyKey>[];
  allAvailableConfigs: TFilterConfig<FilterPropertyKey>[];
  // computed functions
  getConfigById: (id: FilterPropertyKey) => TFilterConfig<FilterPropertyKey> | undefined;
  // helpers
  register: <T extends TFilterConfig<FilterPropertyKey>>(config: T) => void;
  registerAll: (configs: TFilterConfig<FilterPropertyKey>[]) => void;
  updateConfigById: (id: FilterPropertyKey, configUpdates: Partial<TFilterConfig<FilterPropertyKey>>) => void;
}

export type TConfigManagerParams = {
  options?: Partial<TConfigOptions>;
};

export class FilterConfigManager<FilterPropertyKey extends string, TExternalFilterType>
  implements IFilterConfigManager<FilterPropertyKey>
{
  // observables
  filterConfigs: IFilterConfigManager<FilterPropertyKey>["filterConfigs"];
  configOptions: IFilterConfigManager<FilterPropertyKey>["configOptions"];
  // parent filter instance
  _filterInstance: IFilterInstance<FilterPropertyKey, TExternalFilterType>;

  constructor(filterInstance: IFilterInstance<FilterPropertyKey, TExternalFilterType>, params: TConfigManagerParams) {
    this.filterConfigs = new Map<FilterPropertyKey, TFilterConfig<FilterPropertyKey>>();
    this.configOptions = this._initializeConfigOptions(params.options);
    // parent filter instance
    this._filterInstance = filterInstance;

    makeObservable(this, {
      filterConfigs: observable,
      configOptions: observable,
      // computed
      allConfigs: computed,
      allAvailableConfigs: computed,
      // helpers
      register: action,
      registerAll: action,
      updateConfigById: action,
    });
  }

  // ------------ computed ------------

  /**
   * Returns all filterConfigs.
   * @returns All filterConfigs.
   */
  get allConfigs(): TFilterConfig<FilterPropertyKey>[] {
    return Array.from(this.filterConfigs.values());
  }

  /**
   * Returns all available filterConfigs.
   * If allowSameFilters is true, all enabled configs are returned.
   * Otherwise, only configs that are not already applied to the filter instance are returned.
   * @returns All available filterConfigs.
   */
  get allAvailableConfigs(): TFilterConfig<FilterPropertyKey>[] {
    // if allowSameFilters is true, all enabled configs are returned
    if (this.configOptions.allowSameFilters) {
      return this._allEnabledConfigs;
    }

    // get all applied properties
    const appliedProperties = new Set(this._filterInstance.allConditions.map((condition) => condition.property));

    // return all enabled configs that are not already applied to the filter instance
    return this._allEnabledConfigs.filter((config) => !appliedProperties.has(config.id));
  }

  // ------------ computed functions ------------

  /**
   * Returns a config by id.
   * @param id - The id to get the config for.
   * @returns The config for the id, or undefined if not found.
   */
  getConfigById = computedFn((id: FilterPropertyKey): TFilterConfig<FilterPropertyKey> | undefined =>
    this.filterConfigs.get(id)
  );

  // ------------ helpers ------------

  /**
   * Register a config.
   * If a config with the same ID already exists, it will be updated with the new values.
   * Otherwise, a new config will be created.
   * @param config - The config to register.
   */
  register = action(<T extends TFilterConfig<FilterPropertyKey>>(config: T): void => {
    if (this.filterConfigs.has(config.id)) {
      // Update existing config if it has differences
      const existingConfig = this.filterConfigs.get(config.id)!;
      const mergedConfig = { ...existingConfig, ...config };
      if (!isEqual(existingConfig, mergedConfig)) {
        this.filterConfigs.set(config.id, mergedConfig);
      }
    } else {
      // Create new config if it doesn't exist
      this.filterConfigs.set(config.id, config);
    }
  });

  /**
   * Register all configs.
   * @param configs - The configs to register.
   */
  registerAll = action((configs: TFilterConfig<FilterPropertyKey>[]): void => {
    configs.forEach((config) => this.register(config));
  });

  /**
   *
   * Updates a config by id.
   * @param id - The id of the config to update.
   * @param configUpdates - The updates to apply to the config.
   */
  updateConfigById = action((id: FilterPropertyKey, configUpdates: Partial<TFilterConfig<FilterPropertyKey>>): void => {
    const prevConfig = this.filterConfigs.get(id);
    const updatedConfig = merge({}, prevConfig, configUpdates);
    this.filterConfigs.set(id, updatedConfig);
  });

  // ------------ private computed ------------

  /**
   * Returns all enabled filterConfigs.
   * @returns All enabled filterConfigs.
   */
  private get _allEnabledConfigs(): TFilterConfig<FilterPropertyKey>[] {
    return this.allConfigs.filter((config) => config.isEnabled);
  }

  // ------------ private helpers ------------

  /**
   * Initializes the config options.
   * @param options - The options to initialize the config options with.
   * @returns The initialized config options.
   */
  private _initializeConfigOptions(options?: Partial<TConfigOptions>): TConfigOptions {
    return { ...DEFAULT_FILTER_CONFIG_OPTIONS, ...options };
  }
}
