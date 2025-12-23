import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TConfigOptions } from "@plane/constants";
import { DEFAULT_FILTER_CONFIG_OPTIONS } from "@plane/constants";
import type { TExternalFilter, TFilterConfig, TFilterProperty } from "@plane/types";
// local imports
import type { IFilterConfig } from "./config";
import { FilterConfig } from "./config";
import type { IFilterInstance } from "./filter";

/**
 * Interface for managing filter configurations.
 * Provides methods to register, update, and retrieve filter configurations.
 * - filterConfigs: Map storing filter configurations by their ID
 * - configOptions: Configuration options controlling filter behavior
 * - allConfigs: All registered filter configurations
 * - allAvailableConfigs: All available filter configurations based on current state
 * - getConfigByProperty: Retrieves a filter configuration by its ID
 * - register: Registers a single filter configuration
 * - registerAll: Registers multiple filter configurations
 * - updateConfigByProperty: Updates an existing filter configuration by ID
 * @template P - The filter property type extending TFilterProperty
 */
export interface IFilterConfigManager<P extends TFilterProperty> {
  // observables
  filterConfigs: Map<P, IFilterConfig<P>>; // filter property -> config
  configOptions: TConfigOptions;
  areConfigsReady: boolean;
  // computed
  allAvailableConfigs: IFilterConfig<P>[];
  // computed functions
  getConfigByProperty: (property: P) => IFilterConfig<P> | undefined;
  // helpers
  register: <C extends TFilterConfig<P>>(config: C) => void;
  registerAll: (configs: TFilterConfig<P>[]) => void;
  updateConfigByProperty: (property: P, configUpdates: Partial<TFilterConfig<P>>) => void;
  setAreConfigsReady: (value: boolean) => void;
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
export class FilterConfigManager<
  P extends TFilterProperty,
  E extends TExternalFilter = TExternalFilter,
> implements IFilterConfigManager<P> {
  // observables
  filterConfigs: IFilterConfigManager<P>["filterConfigs"];
  configOptions: IFilterConfigManager<P>["configOptions"];
  areConfigsReady: IFilterConfigManager<P>["areConfigsReady"];
  // parent filter instance
  private _filterInstance: IFilterInstance<P, E>;

  /**
   * Creates a new FilterConfigManager instance.
   *
   * @param filterInstance - The parent filter instance this manager belongs to
   * @param params - Configuration parameters for the manager
   */
  constructor(filterInstance: IFilterInstance<P, E>, params: TConfigManagerParams) {
    this.filterConfigs = new Map<P, IFilterConfig<P>>();
    this.configOptions = this._initializeConfigOptions(params.options);
    this.areConfigsReady = true;
    // parent filter instance
    this._filterInstance = filterInstance;

    makeObservable(this, {
      filterConfigs: observable,
      configOptions: observable,
      areConfigsReady: observable,
      // computed
      allAvailableConfigs: computed,
      // helpers
      register: action,
      registerAll: action,
      updateConfigByProperty: action,
      setAreConfigsReady: action,
    });
  }

  // ------------ computed ------------

  /**
   * Returns all available filterConfigs.
   * If allowSameFilters is true, all enabled configs are returned.
   * Otherwise, only configs that are not already applied to the filter instance are returned.
   * @returns All available filterConfigs.
   */
  get allAvailableConfigs(): IFilterConfigManager<P>["allAvailableConfigs"] {
    const appliedProperties = new Set(this._filterInstance.allConditions.map((condition) => condition.property));
    // Return all enabled configs that either allow multiple filters or are not currently applied
    return this._allEnabledConfigs.filter((config) => config.allowMultipleFilters || !appliedProperties.has(config.id));
  }

  // ------------ computed functions ------------

  /**
   * Returns a config by filter property.
   * @param property - The property to get the config for.
   * @returns The config for the property, or undefined if not found.
   */
  getConfigByProperty: IFilterConfigManager<P>["getConfigByProperty"] = computedFn(
    (property) => this.filterConfigs.get(property) as IFilterConfig<P>
  );

  // ------------ helpers ------------

  /**
   * Register a config.
   * If a config with the same property already exists, it will be updated with the new values.
   * Otherwise, a new config will be created.
   * @param configUpdates - The config updates to register.
   */
  register: IFilterConfigManager<P>["register"] = action((configUpdates) => {
    if (this.filterConfigs.has(configUpdates.id)) {
      // Update existing config if it has differences
      const existingConfig = this.filterConfigs.get(configUpdates.id)!;
      existingConfig.mutate(configUpdates);
    } else {
      // Create new config if it doesn't exist
      this.filterConfigs.set(configUpdates.id, new FilterConfig(configUpdates));
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
   * Updates a config by filter property.
   * @param property - The property of the config to update.
   * @param configUpdates - The updates to apply to the config.
   */
  updateConfigByProperty: IFilterConfigManager<P>["updateConfigByProperty"] = action((property, configUpdates) => {
    const prevConfig = this.filterConfigs.get(property);
    prevConfig?.mutate(configUpdates);
  });

  /**
   * Updates the configs ready state.
   * @param value - The new configs ready state.
   */
  setAreConfigsReady: IFilterConfigManager<P>["setAreConfigsReady"] = action((value) => {
    this.areConfigsReady = value;
  });

  // ------------ private computed ------------

  private get _allConfigs(): IFilterConfig<P>[] {
    return Array.from(this.filterConfigs.values());
  }

  /**
   * Returns all enabled filterConfigs.
   * @returns All enabled filterConfigs.
   */
  private get _allEnabledConfigs(): IFilterConfig<P>[] {
    return this._allConfigs.filter((config) => config.isEnabled);
  }

  // ------------ private helpers ------------

  /**
   * Initializes the config options.
   * @param options - The options to initialize the config options with.
   * @returns The initialized config options.
   */
  private _initializeConfigOptions(options?: Partial<TConfigOptions>): TConfigOptions {
    return DEFAULT_FILTER_CONFIG_OPTIONS ? { ...DEFAULT_FILTER_CONFIG_OPTIONS, ...options } : options || {};
  }
}
