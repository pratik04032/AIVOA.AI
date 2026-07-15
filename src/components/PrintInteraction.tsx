import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store.ts';

export default function PrintInteraction() {
  const formState = useSelector((state: RootState) => state.interaction);

  return (
    <div className="hidden print:block w-full text-black bg-white p-8">
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">HCP Interaction Record</h1>
        <div className="text-sm font-mono text-slate-500">
          Generated on {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
        <div>
          <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-1">HCP Name</span>
          <div className="font-medium">{formState.hcpName || 'Not specified'}</div>
          {formState.hcpSpecialty && <div className="text-slate-600 mt-0.5">{formState.hcpSpecialty}</div>}
          {formState.hcpLocation && <div className="text-slate-500 mt-0.5">{formState.hcpLocation}</div>}
        </div>
        <div>
          <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-1">Interaction Details</span>
          <div>Type: <span className="font-medium">{formState.interactionType || 'Not specified'}</span></div>
          <div>Date: <span className="font-medium">{formState.date || 'Not specified'}</span></div>
          <div>Time: <span className="font-medium">{formState.time || 'Not specified'}</span></div>
        </div>
      </div>

      <div className="mb-6">
        <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Topics Discussed</span>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded text-sm whitespace-pre-wrap">
          {formState.topicsDiscussed || 'None recorded'}
        </div>
      </div>

      <div className="mb-6">
        <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Materials Shared</span>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded text-sm whitespace-pre-wrap">
          {formState.materialsShared || 'None recorded'}
        </div>
      </div>

      <div className="mb-6">
        <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Executive Summary</span>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded text-sm whitespace-pre-wrap">
          {formState.executiveSummary || 'None recorded'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Outcomes</span>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded text-sm whitespace-pre-wrap min-h-[100px]">
            {formState.outcomes || 'None recorded'}
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Follow-up Actions</span>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded text-sm whitespace-pre-wrap min-h-[100px]">
            {formState.followUpActions || 'None recorded'}
          </div>
          {formState.followUpDate && (
            <div className="mt-2 text-sm">
              <span className="font-semibold">Target Date:</span> {formState.followUpDate}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <span className="font-bold text-slate-600 block text-xs uppercase tracking-wider mb-2">Sentiment Assessment</span>
        <div className="font-medium text-sm">
          {formState.sentiment || 'Not specified'}
        </div>
      </div>
    </div>
  );
}
