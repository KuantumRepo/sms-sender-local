const API_BASE = "http://127.0.0.1:8000";

export interface Batch {
    id: string;
    template_key: string;
    total_numbers: number;
    success_count: number;
    failure_count: number;
    status: string;
    created_at: string;
    completed_at?: string;
}


export async function uploadBatch(file: File, templateKey: string): Promise<Batch> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("template_key", templateKey);

    const res = await fetch(`${API_BASE}/batches`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to upload batch");
    }

    return res.json();
}

export async function getBatches(): Promise<Batch[]> {
    const res = await fetch(`${API_BASE}/batches`);
    if (!res.ok) {
        throw new Error("Failed to fetch batches");
    }
    return res.json();
}

// -----------------------------
// Template Types & Endpoints
// -----------------------------

export interface TemplateVariation {
    id?: number;
    template_id?: string;
    message_text: string;
}

export interface Template {
    id?: string;
    name: string;
    key: string;
    variations: TemplateVariation[];
}

export const getTemplates = async (): Promise<Template[]> => {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
};

export const createTemplate = async (template: Template): Promise<Template> => {
    const res = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create template');
    }
    return res.json();
};

export const updateTemplate = async (id: string, template: Template): Promise<Template> => {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update template');
    }
    return res.json();
};

export const deleteTemplate = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete template');
    }
};
