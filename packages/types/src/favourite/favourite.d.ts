export type IFavourite = {
	id: string;
	name: string;
	entity_type: string;
	entity_data: {
		name: string;
	};
	is_folder: boolean;
	sort_order: number;
	parent: string | null;
	entity_identifier?: string | null;
	children: IFavourite[];
	project_id: string | null;
};
