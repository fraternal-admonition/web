import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function CMSAssetsPage() {
  await requireAdmin();
  const supabase = await createAdminClient();

  const { data: assets, error } = await supabase
    .from("cms_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assets:", error);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CMS Assets</h1>
          <p className="mt-2 text-gray-600">
            Manage images and media files for your site
          </p>
        </div>
        <Link
          href="/admin/cms/assets/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Upload Asset
        </Link>
      </div>

      {/* Assets Grid */}
      {!assets || assets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No assets yet. Upload your first asset!
          </p>
          <Link
            href="/admin/cms/assets/upload"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Upload Asset →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Asset Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {asset.kind === "image" ? (
                  <img
                    src={asset.path}
                    alt={asset.alt || "Asset"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">{asset.kind}</span>
                  </div>
                )}
              </div>

              {/* Asset Info */}
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {asset.alt || "Untitled"}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {asset.path.split("/").pop()}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500 capitalize">
                    {asset.kind}
                  </span>
                  <form
                    action={`/api/admin/cms/assets/${asset.id}`}
                    method="POST"
                    className="inline"
                  >
                    <input type="hidden" name="_method" value="DELETE" />
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:text-red-900"
                      onClick={(e) => {
                        if (
                          !confirm(
                            "Are you sure you want to delete this asset?"
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
