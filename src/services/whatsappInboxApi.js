/* src/services/whatsappInboxApi.js */
import { apiFetch } from "./apiClient";

/**
 * WhatsApp inbox API
 *
 * Backend routes currently in use:
 * - GET    /whatsapp/inbox/conversations
 * - GET    /whatsapp/inbox/assignable-staff
 * - GET    /whatsapp/inbox/conversations/:id/messages
 * - POST   /whatsapp/inbox/conversations/:id/reply
 * - PATCH  /whatsapp/inbox/conversations/:id/status
 * - PATCH  /whatsapp/inbox/conversations/:id/assign
 * - PATCH  /whatsapp/inbox/conversations/:id/unassign
 * - GET    /whatsapp/inbox/sale-drafts
 * - GET    /whatsapp/inbox/sale-drafts/:saleId
 * - POST   /whatsapp/inbox/conversations/:id/create-sale-draft
 * - PATCH  /whatsapp/inbox/sale-drafts/:saleId
 * - DELETE /whatsapp/inbox/sale-drafts/:saleId
 * - POST   /whatsapp/inbox/sale-drafts/:saleId/finalize
 */

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function trimString(value) {
  const s = String(value || "").trim();
  return s || "";
}

function toBoolean(value) {
  return Boolean(value);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeAssignedUser(value) {
  const item = ensureObject(value);
  if (!Object.keys(item).length) return null;

  return {
    id: trimString(item.id),
    name: trimString(item.name),
    email: trimString(item.email),
    role: trimString(item.role).toUpperCase(),
    isActive: typeof item.isActive === "boolean" ? item.isActive : true,
  };
}

function sanitizeAccount(value) {
  const item = ensureObject(value);
  if (!Object.keys(item).length) return null;

  return {
    id: trimString(item.id),
    phoneNumber: trimString(item.phoneNumber),
    businessName: trimString(item.businessName),
    isActive: typeof item.isActive === "boolean" ? item.isActive : false,
  };
}

function sanitizeConversation(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    phone: trimString(item.phone),
    status: trimString(item.status || "OPEN").toUpperCase(),
    assignedToId: trimString(item.assignedToId),
    accountId: trimString(item.accountId),
    customerId: trimString(item.customerId || item.customer?.id),
    updatedAt: item.updatedAt || null,
    createdAt: item.createdAt || null,
    messageCount: toNumber(item.messageCount, 0),

    customer: item.customer
      ? {
          id: trimString(item.customer.id),
          name: trimString(item.customer.name),
          phone: trimString(item.customer.phone || item.phone),
          email: trimString(item.customer.email),
          address: trimString(item.customer.address),
          tinNumber: trimString(item.customer.tinNumber),
          idNumber: trimString(item.customer.idNumber),
          notes: trimString(item.customer.notes),
          isActive:
            typeof item.customer.isActive === "boolean" ? item.customer.isActive : undefined,
          whatsappOptIn:
            typeof item.customer.whatsappOptIn === "boolean"
              ? item.customer.whatsappOptIn
              : undefined,
        }
      : null,

    assignedTo: sanitizeAssignedUser(item.assignedTo),
    account: sanitizeAccount(item.account),

    latestMessage: item.latestMessage
      ? {
          id: trimString(item.latestMessage.id),
          direction: trimString(item.latestMessage.direction || "INBOUND").toUpperCase(),
          type: trimString(item.latestMessage.type || "TEXT").toUpperCase(),
          textContent:
            typeof item.latestMessage.textContent === "string"
              ? item.latestMessage.textContent
              : "",
          mediaUrl: trimString(item.latestMessage.mediaUrl),
          messageId: trimString(item.latestMessage.messageId),
          createdAt: item.latestMessage.createdAt || null,
          sentById: trimString(item.latestMessage.sentById),
        }
      : null,
  };
}

function sanitizeMessage(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    direction: trimString(item.direction || "INBOUND").toUpperCase(),
    type: trimString(item.type || "TEXT").toUpperCase(),
    textContent: typeof item.textContent === "string" ? item.textContent : "",
    mediaUrl: trimString(item.mediaUrl),
    messageId: trimString(item.messageId),
    createdAt: item.createdAt || null,
    sentById: trimString(item.sentById),
  };
}

function sanitizeDraftItem(value) {
  const item = ensureObject(value);
  const product = ensureObject(item.product);

  return {
    id: trimString(item.id),
    saleId: trimString(item.saleId),
    productId: trimString(item.productId),
    quantity: toNumber(item.quantity, 0),
    price: toNumber(item.price ?? item.unitPrice, 0),
    unitPrice: toNumber(item.price ?? item.unitPrice, 0),
    product: Object.keys(product).length
      ? {
          id: trimString(product.id),
          name: trimString(product.name),
          sku: trimString(product.sku),
          serial: trimString(product.serial),
          sellPrice: toNumber(product.sellPrice, 0),
          stockQty: toNumber(product.stockQty, 0),
        }
      : null,
  };
}

function sanitizeDraft(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    tenantId: trimString(item.tenantId),
    cashierId: trimString(item.cashierId),
    customerId: trimString(item.customerId),
    conversationId: trimString(item.conversationId || item.conversation?.id),
    total: toNumber(item.total, 0),
    saleType: trimString(item.saleType || "CREDIT").toUpperCase(),
    amountPaid: toNumber(item.amountPaid, 0),
    balanceDue: toNumber(item.balanceDue, 0),
    dueDate: item.dueDate || null,
    status: trimString(item.status),
    isDraft: typeof item.isDraft === "boolean" ? item.isDraft : true,
    draftSource: trimString(item.draftSource),
    receiptNumber: trimString(item.receiptNumber),
    invoiceNumber: trimString(item.invoiceNumber),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || item.finalizedAt || item.createdAt || null,
    finalizedAt: item.finalizedAt || null,

    cashier: item.cashier
      ? {
          id: trimString(item.cashier.id),
          name: trimString(item.cashier.name),
        }
      : null,

    customer: item.customer
      ? {
          id: trimString(item.customer.id),
          name: trimString(item.customer.name),
          phone: trimString(item.customer.phone),
          email: trimString(item.customer.email),
          address: trimString(item.customer.address),
          tinNumber: trimString(item.customer.tinNumber),
          idNumber: trimString(item.customer.idNumber),
          notes: trimString(item.customer.notes),
          isActive:
            typeof item.customer.isActive === "boolean" ? item.customer.isActive : undefined,
          whatsappOptIn:
            typeof item.customer.whatsappOptIn === "boolean"
              ? item.customer.whatsappOptIn
              : undefined,
        }
      : null,

    conversation: item.conversation
      ? {
          id: trimString(item.conversation.id),
          phone: trimString(item.conversation.phone),
          status: trimString(item.conversation.status || "OPEN").toUpperCase(),
        }
      : null,

    items: ensureArray(item.items).map(sanitizeDraftItem),
  };
}

function sanitizePayment(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    amount: toNumber(item.amount, 0),
    method: trimString(item.method).toUpperCase(),
    createdAt: item.createdAt || null,
    note: trimString(item.note),
  };
}

function sanitizeCashMovement(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    type: trimString(item.type).toUpperCase(),
    reason: trimString(item.reason).toUpperCase(),
    amount: item.amount != null ? String(item.amount) : "",
    note: trimString(item.note),
    createdAt: item.createdAt || item.created_at || null,
    createdBy: trimString(item.createdBy || item.created_by),
  };
}

function sanitizeStaff(value) {
  const item = ensureObject(value);

  return {
    id: trimString(item.id),
    name: trimString(item.name),
    email: trimString(item.email),
    role: trimString(item.role).toUpperCase(),
    isActive: typeof item.isActive === "boolean" ? item.isActive : true,
  };
}

/**
 * Conversations
 */

export async function listWhatsAppConversations() {
  const data = await apiFetch("/whatsapp/inbox/conversations");

  return {
    conversations: ensureArray(data?.conversations).map(sanitizeConversation),
  };
}

export async function getWhatsAppConversation(conversationId) {
  const id = trimString(conversationId);

  if (!id) {
    return { conversation: null };
  }

  const data = await listWhatsAppConversations();
  const conversation = data.conversations.find((item) => item.id === id) || null;

  return { conversation };
}

export async function listWhatsAppConversationMessages(conversationId) {
  const id = trimString(conversationId);

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/messages`);

  return {
    conversationId: trimString(data?.conversationId || id),
    conversation: data?.conversation ? sanitizeConversation(data.conversation) : null,
    messages: ensureArray(data?.messages).map(sanitizeMessage),
  };
}

export async function replyToWhatsAppConversation(conversationId, payload) {
  const id = trimString(conversationId);
  const body = {
    text: trimString(ensureObject(payload).text),
  };

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/reply`, {
    method: "POST",
    body,
  });

  return {
    sent: toBoolean(data?.sent),
    message: data?.message
      ? {
          id: trimString(data.message.id),
          messageId: trimString(data.message.messageId),
          createdAt: data.message.createdAt || null,
          sentById: trimString(data.message.sentById),
          direction: "OUTBOUND",
          type: "TEXT",
          textContent: body.text,
          mediaUrl: "",
        }
      : null,
  };
}

export async function updateWhatsAppConversationStatus(conversationId, payload) {
  const id = trimString(conversationId);
  const status = trimString(ensureObject(payload).status).toUpperCase();

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/status`, {
    method: "PATCH",
    body: { status },
  });

  return {
    updated: data?.updated
      ? {
          id: trimString(data.updated.id),
          status: trimString(data.updated.status).toUpperCase(),
          updatedAt: data.updated.updatedAt || null,
        }
      : null,
  };
}

/**
 * Assignable staff
 */

export async function listAssignableWhatsAppStaff() {
  const data = await apiFetch("/whatsapp/inbox/assignable-staff");

  return {
    staff: ensureArray(data?.staff).map(sanitizeStaff),
  };
}

/**
 * Assignment
 */

export async function assignWhatsAppConversationOwner(conversationId, payload) {
  const id = trimString(conversationId);
  const body = {
    assignedToId: trimString(ensureObject(payload).assignedToId),
  };

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/assign`, {
    method: "PATCH",
    body,
  });

  return {
    ok: toBoolean(data?.ok),
    message: trimString(data?.message),
    conversation: data?.conversation ? sanitizeConversation(data.conversation) : null,
  };
}

export async function clearWhatsAppConversationOwner(conversationId) {
  const id = trimString(conversationId);

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/unassign`, {
    method: "PATCH",
  });

  return {
    ok: toBoolean(data?.ok),
    message: trimString(data?.message),
    conversation: data?.conversation ? sanitizeConversation(data.conversation) : null,
  };
}

/**
 * Sale drafts
 */

export async function listWhatsAppSaleDrafts() {
  const data = await apiFetch("/whatsapp/inbox/sale-drafts");

  return {
    drafts: ensureArray(data?.drafts).map(sanitizeDraft),
  };
}

export async function getWhatsAppSaleDraft(saleId) {
  const id = trimString(saleId);

  const data = await apiFetch(`/whatsapp/inbox/sale-drafts/${id}`);

  return {
    draft: data?.draft ? sanitizeDraft(data.draft) : null,
  };
}

export async function createWhatsAppSaleDraft(conversationId, payload) {
  const id = trimString(conversationId);
  const body = ensureObject(payload);

  const data = await apiFetch(`/whatsapp/inbox/conversations/${id}/create-sale-draft`, {
    method: "POST",
    body,
  });

  return {
    created: toBoolean(data?.created),
    draft: data?.draft ? sanitizeDraft(data.draft) : null,
  };
}

export async function updateWhatsAppSaleDraft(saleId, payload) {
  const id = trimString(saleId);
  const body = ensureObject(payload);

  const data = await apiFetch(`/whatsapp/inbox/sale-drafts/${id}`, {
    method: "PATCH",
    body,
  });

  return {
    updated: toBoolean(data?.updated),
    draft: data?.draft ? sanitizeDraft(data.draft) : null,
  };
}

export async function deleteWhatsAppSaleDraft(saleId) {
  const id = trimString(saleId);

  const data = await apiFetch(`/whatsapp/inbox/sale-drafts/${id}`, {
    method: "DELETE",
  });

  return {
    deleted: toBoolean(data?.deleted),
    saleId: trimString(data?.saleId || id),
  };
}

export async function finalizeWhatsAppSaleDraft(saleId, payload) {
  const id = trimString(saleId);
  const body = ensureObject(payload);

  const data = await apiFetch(`/whatsapp/inbox/sale-drafts/${id}/finalize`, {
    method: "POST",
    body,
  });

  return {
    finalized: toBoolean(data?.finalized),
    sale: data?.sale ? sanitizeDraft(data.sale) : null,
    payment: data?.payment ? sanitizePayment(data.payment) : null,
    cashMovement: data?.cashMovement ? sanitizeCashMovement(data.cashMovement) : null,
  };
}

/**
 * Stable aliases
 */
export const assignConversationOwner = assignWhatsAppConversationOwner;
export const clearConversationOwner = clearWhatsAppConversationOwner;
export const listAssignableStaff = listAssignableWhatsAppStaff;

export {
  sanitizeConversation,
  sanitizeMessage,
  sanitizeDraft,
  sanitizeStaff,
  sanitizeAssignedUser,
  sanitizeAccount,
};