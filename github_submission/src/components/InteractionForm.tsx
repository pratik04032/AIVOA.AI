import { useDispatch, useSelector } from 'react-redux';
import { RootState, updateField, InteractionState } from '../store.ts';

export default function InteractionForm() {
  const dispatch = useDispatch();
  const formState = useSelector((state: RootState) => state.interaction);

  const handleChange = (field: keyof InteractionState, value: string) => {
    dispatch(updateField({ field, value }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HCP Name</label>
          <input
            type="text"
            placeholder="Search or select HCP..."
            value={formState.hcpName}
            onChange={(e) => handleChange('hcpName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interaction Type</label>
          <select
            value={formState.interactionType}
            onChange={(e) => handleChange('interactionType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Select...</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formState.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            value={formState.time}
            onChange={(e) => handleChange('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
        <input
          type="text"
          placeholder="Enter names or search..."
          value={formState.attendees}
          onChange={(e) => handleChange('attendees', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topics Discussed</label>
        <textarea
          placeholder="Enter key discussion points..."
          rows={3}
          value={formState.topicsDiscussed}
          onChange={(e) => handleChange('topicsDiscussed', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button className="mt-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center">
          <span className="mr-1">🎙️</span> Summarize from Voice Note (Requires Consent)
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">Materials Shared / Samples Distributed</h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">Materials Shared</span>
          <button className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 bg-white">🔍 Search/Add</button>
        </div>
        <div className="text-xs text-gray-400 mb-2">No materials added.</div>
        
        <div className="flex items-center justify-between py-2 border-t border-gray-100 mt-2">
          <span className="text-sm text-gray-500">Samples Distributed</span>
          <button className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 bg-white">➕ Add Sample</button>
        </div>
        <div className="text-xs text-gray-400">No samples added.</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Observed/Inferred HCP Sentiment</label>
        <div className="flex space-x-4">
          {['Positive', 'Neutral', 'Negative'].map((sentiment) => (
            <label key={sentiment} className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="radio"
                name="sentiment"
                value={sentiment}
                checked={formState.sentiment === sentiment}
                onChange={(e) => handleChange('sentiment', e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{sentiment}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Outcomes</label>
        <textarea
          placeholder="Key outcomes or agreements..."
          rows={2}
          value={formState.outcomes}
          onChange={(e) => handleChange('outcomes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Actions</label>
        <textarea
          placeholder="Enter next steps or tasks..."
          rows={2}
          value={formState.followUpActions}
          onChange={(e) => handleChange('followUpActions', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      
      {formState.followUpActions && (
        <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">AI Suggested Follow-ups:</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li className="flex items-center space-x-1 cursor-pointer hover:underline">
              <span>+</span> <span>Schedule follow-up meeting in 2 weeks</span>
            </li>
            <li className="flex items-center space-x-1 cursor-pointer hover:underline">
              <span>+</span> <span>Send OncoBoost Phase III PDF</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
