import { TabTask, TaskFilterTabsProps } from "@/lib/type";

const TaskFilterTabs = ({ activeTab, setActiveTab }: TaskFilterTabsProps) => {
  const tabs = [
    {
      key: "all",
      label: "All",
      activeClass:
        "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent",
      hoverClass: "hover:border-zinc-800 dark:hover:border-zinc-100",
    },
    {
      key: "user",
      label: "My Tasks",
      activeClass: "bg-secondary text-white border-transparent shadow-sm",
      hoverClass: "hover:border-secondary",
    },
    {
      key: "TODO",
      label: "Todo",
      activeClass: "bg-default-500 text-white border-transparent",
      hoverClass: "hover:border-default-500",
    },
    {
      key: "PROGRESS",
      label: "Progress",
      activeClass: "bg-primary text-white border-transparent",
      hoverClass: "hover:border-primary",
    },
    {
      key: "DONE",
      label: "Done",
      activeClass: "bg-success text-white border-transparent",
      hoverClass: "hover:border-success",
    },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabTask)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-all border ${
              active
                ? `${tab.activeClass} shadow-md`
                : `bg-transparent text-default-600 dark:text-zinc-400 border-default-300 dark:border-zinc-700 ${tab.hoverClass}`
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TaskFilterTabs;
