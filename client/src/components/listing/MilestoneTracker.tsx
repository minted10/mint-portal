import { Check, Circle } from "lucide-react";

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
}

interface MilestoneTrackerProps {
  listingStatus: string;
  listDate?: Date;
}

export default function MilestoneTracker({ listingStatus }: MilestoneTrackerProps) {
  const milestones: Milestone[] = [
    { id: "start", label: "Start", completed: true },
    { id: "listing-agreement", label: "Listing Agreement Signed", completed: listingStatus !== "pre-listing" },
    { id: "home-prep", label: "Home Prep", completed: ["coming-soon", "active", "under-contract", "sold"].includes(listingStatus) },
    { id: "coming-soon", label: "Coming Soon", completed: ["active", "under-contract", "sold"].includes(listingStatus) },
    { id: "active", label: "Active on Market", completed: ["under-contract", "sold"].includes(listingStatus) },
    { id: "escrow", label: "In Escrow", completed: ["under-contract", "sold"].includes(listingStatus) },
    { id: "contingencies", label: "Contingencies Removed", completed: listingStatus === "sold" },
    { id: "closed", label: "Closed", completed: listingStatus === "sold" },
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const progressPercent = (completedCount / milestones.length) * 100;

  return (
    <div className="w-full bg-white rounded-[20px] p-6 shadow-sm">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-[#1E1E1E]">Listing Milestone Progress</h3>
          <span className="text-xs font-medium text-[#6B7280]">{completedCount} of {milestones.length}</span>
        </div>
        <div className="w-full h-2 bg-[#F0F2F5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6db08a] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestone Steps */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex items-center gap-2 flex-shrink-0">
            {/* Milestone Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  milestone.completed
                    ? "bg-[#6db08a] text-white"
                    : "bg-[#F0F2F5] text-[#6B7280]"
                }`}
              >
                {milestone.completed ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <Circle size={20} strokeWidth={2} />
                )}
              </div>
              {/* Label */}
              <span className="text-xs font-medium text-[#1E1E1E] mt-2 text-center whitespace-nowrap max-w-[80px]">
                {milestone.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < milestones.length - 1 && (
              <div
                className={`h-1 w-6 transition-all ${
                  milestone.completed ? "bg-[#6db08a]" : "bg-[#E5E7EB]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
