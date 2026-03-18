import SwiftUI
import FamilyControls

/// Wraps Apple's FamilyActivityPicker in a navigation chrome with
/// Cancel / Done buttons.  Interactive sheet dismiss is disabled so the
/// hosting continuation in ScreenTimeModule always resolves.
struct ScreenTimePickerView: View {
    @State var selection: FamilyActivitySelection
    let onComplete: (FamilyActivitySelection) -> Void
    let onCancel: () -> Void

    init(
        initialSelection: FamilyActivitySelection,
        onComplete: @escaping (FamilyActivitySelection) -> Void,
        onCancel: @escaping () -> Void
    ) {
        _selection = State(initialValue: initialSelection)
        self.onComplete = onComplete
        self.onCancel = onCancel
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Summary bar showing live counts as the user toggles items
                HStack(spacing: 16) {
                    countBadge(
                        count: selection.applicationTokens.count,
                        label: "Apps",
                        color: .blue
                    )
                    countBadge(
                        count: selection.categoryTokens.count,
                        label: "Categories",
                        color: .purple
                    )
                    countBadge(
                        count: selection.webDomainTokens.count,
                        label: "Websites",
                        color: .orange
                    )
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 16)
                .background(Color(.systemGroupedBackground))

                FamilyActivityPicker(
                    headerText: "Choose apps or categories to restrict",
                    selection: $selection
                )
            }
            .navigationTitle("Select Apps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { onCancel() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { onComplete(selection) }
                        .bold()
                }
            }
        }
        .interactiveDismissDisabled()
    }

    // MARK: - Helpers

    @ViewBuilder
    private func countBadge(count: Int, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.title3.bold())
                .foregroundColor(count > 0 ? color : .secondary)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
