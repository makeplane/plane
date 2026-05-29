import { action, makeObservable, observable, runInAction } from "mobx";
import type { ISupportTicket, ISupportTicketCreate } from "@/services/support-ticket.service";
import { SupportTicketService } from "@/services/support-ticket.service";

export interface ISupportTicketStore {
  // observables
  ticketMap: Record<string, ISupportTicket>;
  ticketIds: string[];
  loader: boolean;
  // actions
  fetchTickets: (workspaceSlug: string, projectId: string) => Promise<ISupportTicket[]>;
  createTicket: (workspaceSlug: string, projectId: string, data: ISupportTicketCreate) => Promise<ISupportTicket>;
  updateTicket: (
    workspaceSlug: string,
    projectId: string,
    ticketId: string,
    data: Partial<ISupportTicketCreate>
  ) => Promise<ISupportTicket>;
  deleteTicket: (workspaceSlug: string, projectId: string, ticketId: string) => Promise<void>;
  getTicketById: (ticketId: string) => ISupportTicket | undefined;
}

export class SupportTicketStore implements ISupportTicketStore {
  // observables
  ticketMap: Record<string, ISupportTicket> = {};
  ticketIds: string[] = [];
  loader = false;
  // service
  supportTicketService: SupportTicketService;

  constructor() {
    makeObservable(this, {
      ticketMap: observable,
      ticketIds: observable,
      loader: observable,
      fetchTickets: action,
      createTicket: action,
      updateTicket: action,
      deleteTicket: action,
    });
    this.supportTicketService = new SupportTicketService();
  }

  /**
   * Fetch all tickets for a project
   */
  fetchTickets = async (workspaceSlug: string, projectId: string): Promise<ISupportTicket[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const tickets = await this.supportTicketService.getTickets(workspaceSlug, projectId);

      runInAction(() => {
        const newMap: Record<string, ISupportTicket> = {};
        const ids: string[] = [];
        for (const ticket of tickets) {
          newMap[ticket.id] = ticket;
          ids.push(ticket.id);
        }
        this.ticketMap = newMap;
        this.ticketIds = ids;
        this.loader = false;
      });

      return tickets;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  /**
   * Create a new ticket
   */
  createTicket = async (
    workspaceSlug: string,
    projectId: string,
    data: ISupportTicketCreate
  ): Promise<ISupportTicket> => {
    const ticket = await this.supportTicketService.createTicket(workspaceSlug, projectId, data);

    runInAction(() => {
      this.ticketMap[ticket.id] = ticket;
      this.ticketIds = [ticket.id, ...this.ticketIds];
    });

    return ticket;
  };

  /**
   * Update an existing ticket
   */
  updateTicket = async (
    workspaceSlug: string,
    projectId: string,
    ticketId: string,
    data: Partial<ISupportTicketCreate>
  ): Promise<ISupportTicket> => {
    const ticket = await this.supportTicketService.updateTicket(workspaceSlug, projectId, ticketId, data);

    runInAction(() => {
      this.ticketMap[ticketId] = ticket;
    });

    return ticket;
  };

  /**
   * Delete a ticket
   */
  deleteTicket = async (workspaceSlug: string, projectId: string, ticketId: string): Promise<void> => {
    await this.supportTicketService.deleteTicket(workspaceSlug, projectId, ticketId);

    runInAction(() => {
      delete this.ticketMap[ticketId];
      this.ticketIds = this.ticketIds.filter((id) => id !== ticketId);
    });
  };

  /**
   * Get a ticket by ID
   */
  getTicketById = (ticketId: string): ISupportTicket | undefined => this.ticketMap[ticketId];
}
