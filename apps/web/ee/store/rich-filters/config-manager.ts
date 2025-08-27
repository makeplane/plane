import isEqual from "lodash/isEqual";
import merge from "lodash/merge";
import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { DEFAULT_FILTER_CONFIG_OPTIONS, TConfigOptions } from "@plane/constants";
import { TExternalFilter, TFilterConfig, TFilterProperty, TFilterValue } from "@plane/types";
// local imports
import { IFilterInstance } from "./filter";

/**
 * Interface for managing filter configurations.
 * Provides methods to register, update, and retrieve filter configurations.
 * - filterConfigs: Map storing filter configurations by their ID
 * - configOptions: Configuration options controlling filter behavior
 * - allConfigs: All registered filter configurations
 * - allAvailableConfigs: All available filter configurations based on current state
 * - getConfigById: Retrieves a filter configuration by its ID
 * - register: Registers a single filter configuration
 * - registerAll: Registers multiple filter configurations
 * - updateConfigById: Updates an existing filter configuration by ID
 * @template P - The filter property type extending TFilterProperty
 */
export interface IFilterConfigManager<P extends TFilterProperty> {
  // observables
  filterConfigs: Map<string, TFilterConfig<P, TFilterValue>>; // config id -> config
  configOptions: TConfigOptions;
  // computed
  allConfigs: TFilterConfig<P, TFilterValue>[];
  allAvailableConfigs: TFilterConfig<P, TFilterValue>[];
  // computed functions
  getConfigById: (id: string) => TFilterConfig<P, TFilterValue> | undefined;
  // helpers
  register: <C extends TFilterConfig<P, TFilterValue>>(config: C) => void;
  registerAll: (configs: TFilterConfig<P, TFilterValue>[]) => void;
  updateConfigById: (id: string, configUpdates: Partial<TFilterConfig<P, TFilterValue>>) => void;
}

/**
 * Parameters for initializing the FilterConfigManager.
 * - options: Optional configuration options to override defaults
 */
export type TConfigManagerParams = {
  options?: Partial<TConfigOptions>;
};

/**
 * Manages filter configurations for a filter instance.
 * Handles registration, updates, and retrieval of filter configurations.
 * Provides computed properties for available configurations based on current filter state.
 *
 * @template P - The filter property type extending TFilterProperty
 * @template V - The filter value type extending TFilterValue
 * @template E - The external filter type extending TExternalFilter
 */
export class FilterConfigManager<P extends TFilterProperty, E extends TExternalFilter>
  implements IFilterConfigManager<P>
{
  // observables
  filterConfigs: IFilterConfigManager<P>["filterConfigs"];
  configOptions: IFilterConfigManager<P>["configOptions"];
  // parent filter instance
  _filterInstance: IFilterInstance<P, E>;

  /**
   * Creates a new FilterConfigManager instance.
   *
   * @param filterInstance - The parent filter instance this manager belongs to
   * @param params - Configuration parameters for the manager
   */
  constructor(filterInstance: IFilterInstance<P, E>, params: TConfigManagerParams) {
    this.filterConfigs = new Map<P, TFilterConfig<P, TFilterValue>>();
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
  get allConfigs(): IFilterConfigManager<P>["allConfigs"] {
    return Array.from(this.filterConfigs.values());
  }

  /**
   * Returns all available filterConfigs.
   * If allowSameFilters is true, all enabled configs are returned.
   * Otherwise, only configs that are not already applied to the filter instance are returned.
   * @returns All available filterConfigs.
   */
  get allAvailableConfigs(): IFilterConfigManager<P>["allAvailableConfigs"] {
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
  getConfigById: IFilterConfigManager<P>["getConfigById"] = computedFn(
    (id) => this.filterConfigs.get(id) as TFilterConfig<P, TFilterValue>
  );

  // ------------ helpers ------------

  /**
   * Register a config.
   * If a config with the same ID already exists, it will be updated with the new values.
   * Otherwise, a new config will be created.
   * @param config - The config to register.
   */
  register: IFilterConfigManager<P>["register"] = action((config) => {
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
  registerAll: IFilterConfigManager<P>["registerAll"] = action((configs) => {
    configs.forEach((config) => this.register(config));
  });

  /**
   *
   * Updates a config by id.
   * @param id - The id of the config to update.
   * @param configUpdates - The updates to apply to the config.
   */
  updateConfigById: IFilterConfigManager<P>["updateConfigById"] = action((id, configUpdates) => {
    const prevConfig = this.filterConfigs.get(id);
    const updatedConfig = merge({}, prevConfig, configUpdates);
    this.filterConfigs.set(id, updatedConfig);
  });

  // ------------ private computed ------------

  /**
   * Returns all enabled filterConfigs.
   * @returns All enabled filterConfigs.
   */
  private get _allEnabledConfigs(): TFilterConfig<P, TFilterValue>[] {
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
