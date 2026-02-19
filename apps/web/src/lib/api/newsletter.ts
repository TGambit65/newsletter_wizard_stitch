import { callEdgeFunction } from './core';

interface SendMailchimpRequest {
  api_key:      string;
  list_id:      string;
  subject:      string;
  from_name?:   string;
  from_email?:  string;
  content_html: string;
}

interface SendConvertKitRequest {
  api_secret:   string;
  subject:      string;
  content_html: string;
}

export async function sendMailchimp(request: SendMailchimpRequest): Promise<{ success: boolean; campaign_id: string }> {
  return callEdgeFunction('send-mailchimp', request);
}

export async function sendConvertKit(request: SendConvertKitRequest): Promise<{ success: boolean; broadcast_id: string }> {
  return callEdgeFunction('send-convertkit', request);
}
