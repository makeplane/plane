// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import IssueService from "services/issue.service";

class IssueStore {
  // issueStateFilters = [];
  // issueLabelsFilters = [];
  // issueUserFilters = {
  //   priority: [],
  //   state: [],
  //   labels: [],
  // };

  currentIssueView = "list";
  issues = null;
  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentIssueView: observable,
      issues: observable,
      // action
      setCurrentIssueView: action,
      setIssues: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
    this.initialLoad();
  }

  setCurrentIssueView = async (view: string) => {
    this.currentIssueView = view;
  };

  setIssues = async () => {};

  // init load
  initialLoad() {}
}

export default IssueStore;
