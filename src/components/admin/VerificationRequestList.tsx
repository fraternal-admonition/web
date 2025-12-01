"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Assignment {
  id: string;
  status: "PENDING" | "DONE" | "EXPIRED";
  assigned_at: string;
  deadline: string;
  completed_at: string | null;
}

interface VerificationRequest {
  id: string;
  submission_code: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  peer_verification_result: any;
  user: {
    display_id: string;
  };
  peer_assignments: Assignment[];
}

interface Props {
  requests: VerificationRequest[];
}

export default function VerificationRequestList({ requests }: Props) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-8 text-center">
        <p className="text-[#666]">No active verification requests</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E5E0]">
          <thead className="bg-[#F9F9F7]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                Submission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                Time Since Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E5E0]">
            {requests.map((request) => {
              const completedCount =
                request.peer_assignments?.filter((a) => a.status === "DONE")
                  .length || 0;
              const totalCount = request.peer_assignments?.length || 0;
              const expiredCount =
                request.peer_assignments?.filter((a) => a.status === "EXPIRED")
                  .length || 0;
              const completionPercentage =
                totalCount > 0 ? (completedCount / 10) * 100 : 0;

              return (
                <tr key={request.id} className="hover:bg-[#F9F9F7]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#222]">
                      {request.submission_code}
                    </div>
                    <div className="text-sm text-[#666] truncate max-w-xs">
                      {request.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#666]">
                      {request.user?.display_id || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#222]">
                            {completedCount}/10 reviews
                          </span>
                          <span className="text-xs text-[#666]">
                            {Math.round(completionPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E5E5E0] rounded-full h-2">
                          <div
                            className="bg-[#004D40] h-2 rounded-full transition-all"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        {expiredCount > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {expiredCount} expired
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666]">
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/peer-verification/${request.id}`}
                      className="text-[#004D40] hover:text-[#00695C] font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
