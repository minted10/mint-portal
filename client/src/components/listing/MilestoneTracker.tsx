interface MilestoneTrackerProps {
  listingStatus: string;
  listDate?: Date;
}

export default function MilestoneTracker({ listingStatus }: MilestoneTrackerProps) {
  const milestones = [
    { id: "start", label: "Start" },
    { id: "listing-agreement", label: "Listing Agreement" },
    { id: "home-prep", label: "Home Prep" },
    { id: "coming-soon", label: "Coming Soon" },
    { id: "active", label: "Active" },
    { id: "escrow", label: "In Escrow" },
    { id: "contingencies", label: "Contingencies" },
    { id: "closed", label: "Closed" },
  ];

  // Determine which milestones are completed based on status
  const isCompleted = (index: number) => {
    const statusMap: Record<string, number> = {
      "pre-listing": 0,
      "coming-soon": 3,
      "active": 4,
      "under-contract": 5,
      "sold": 7,
    };
    const completedUpTo = statusMap[listingStatus] ?? 0;
    return index <= completedUpTo;
  };

  const completedCount = milestones.filter((_, i) => isCompleted(i)).length;
  const progressPercent = (completedCount / milestones.length) * 100;

  return (
    <div className="w-full bg-white rounded-[20px] p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium text-[#1E1E1E]">Listing Progress</h3>
        <span className="text-xs font-medium text-[#6B7280]">{completedCount} of {milestones.length}</span>
      </div>

      {/* Minimalist Dots Timeline */}
      <div className="relative">
        {/* Background connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E5E7EB]" />
        
        {/* Completed progress line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-[#6db08a] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Dots */}
        <div className="relative flex justify-between items-start">
          {milestones.map((milestone, index) => {
            const completed = isCompleted(index);
            return (
              <div key={milestone.id} className="flex flex-col items-center gap-2">
                {/* Dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    completed
                      ? "bg-[#6db08a] ring-2 ring-[#6db08a] ring-offset-2"
                      : "bg-[#E5E7EB]"
                  }`}
                />
                {/* Label */}
                <span className="text-xs font-medium text-[#6B7280] text-center max-w-[70px] leading-tight">
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
