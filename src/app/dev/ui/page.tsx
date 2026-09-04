import {
  Button,
  Card,
  CardBody,
  CardTitle,
  DatePicker,
  DurationPicker,
  EmptyState,
  Field,
  Frame,
  PageHeader,
  Select,
  StatusPill,
  TBody,
  THead,
  Table,
  Td,
  TextArea,
  Th,
  Tr,
} from "@/components/ui";
import { utcDate } from "@/lib/dates";
import { formatPence } from "@/lib/money";

import { ModalDemo, ToastDemo, ToastSamples } from "./ModalDemo";
import styles from "./page.module.css";

/**
 * Every primitive in every state.
 *
 * This page exists so a visual regression is obvious in one scroll rather than
 * discovered on a feature page three prompts later. It is a development tool,
 * not part of the product, and is not linked from any area shell.
 */

const COLOURS = [
  ["carbon", "Carbon"],
  ["coral", "Signal coral"],
  ["warmWhite", "Warm white"],
  ["atlantic", "Atlantic"],
  ["concrete", "Concrete"],
  ["mist", "Mist"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["danger", "Danger"],
  ["info", "Info"],
] as const;

const STATUSES = [
  "DRAFT",
  "ISSUED",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "HELD",
  "BOOKED",
  "RELEASED",
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "FAILED",
  "SUBMITTED",
  "REVIEWING",
  "CONVERTED",
  "PARTIALLY_CONVERTED",
  "DECLINED",
  "WITHDRAWN",
  "PENDING",
  "UNAVAILABLE",
  "DROPPED",
  "AVAILABLE",
];

// A fixed date, so the picker options do not shift between renders.
const REFERENCE_DATE = utcDate(2026, 10, 7);

export default function DevUiPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Development"
        title="UI primitives"
        description="Every component in @/components/ui, in every state it supports. Ported from the brand kit; not linked from the app."
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Colour</h2>
        <p className={styles.sectionNote}>
          The whole palette. Every component style resolves to one of these
          through an --im-* variable, so no component holds a raw hex.
        </p>
        <div className={styles.swatchGrid}>
          {COLOURS.map(([key, label]) => (
            <div key={key} className={styles.swatch}>
              <div className={[styles.swatchChip, styles[key]].join(" ")} />
              <p className={styles.swatchLabel}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Type scale</h2>
        <p className={styles.sectionNote}>
          From island-media-tokens.json. Avenir Next falls back to Nunito Sans,
          which is why this renders consistently away from a design machine.
        </p>
        <p className={[styles.typeSample, styles.display].join(" ")}>Display 56/60</p>
        <p className={[styles.typeSample, styles.h1].join(" ")}>Heading 1, 40/44</p>
        <p className={[styles.typeSample, styles.h2].join(" ")}>Heading 2, 32/36</p>
        <p className={[styles.typeSample, styles.h3].join(" ")}>Heading 3, 24/30</p>
        <p className={[styles.typeSample, styles.bodyLg].join(" ")}>Body large, 18/28</p>
        <p className={[styles.typeSample, styles.body].join(" ")}>Body, 16/24</p>
        <p className={[styles.typeSample, styles.small].join(" ")}>Small, 14/20</p>
        <p className={[styles.typeSample, styles.labelSample].join(" ")}>Label, 13/16</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Button</h2>
        <p className={styles.sectionNote}>
          Ported from .im-button-primary, which is already 44px tall. A button
          says what happens: Issue contract, not Submit.
        </p>
        <div className={styles.row}>
          <Button variant="primary">Issue contract</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="danger">Cancel contract</Button>
          <Button variant="ghost">Dismiss</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" disabled>
            Issue contract
          </Button>
          <Button variant="secondary" disabled>
            Save draft
          </Button>
          <Button variant="danger" disabled>
            Cancel contract
          </Button>
          <Button variant="ghost" disabled>
            Dismiss
          </Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" size="small">
            Small primary
          </Button>
          <Button variant="secondary" size="small">
            Small secondary
          </Button>
          <Button href="/management">As a link</Button>
        </div>
        <div className={styles.row}>
          <Button fullWidth>Full width, the field primary action</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Card</h2>
        <div className={styles.cols}>
          <Card>
            <CardTitle>Default</CardTitle>
            <CardBody>
              Ported from .im-surface: one mist border, surface radius, white
              ground.
            </CardBody>
          </Card>
          <Card raised>
            <CardTitle>Raised</CardTitle>
            <CardBody>
              With the brand surface shadow, as used by the search strip.
            </CardBody>
          </Card>
          <Card feature raised>
            <CardTitle>Feature</CardTitle>
            <CardBody>Feature radius, for hero panels.</CardBody>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Status pill</h2>
        <p className={styles.sectionNote}>
          Ported from .im-status-*. Every domain state maps to one of five
          tones, so a pill can never fall through to a default that misreports a
          failed job.
        </p>
        <div className={styles.row}>
          {STATUSES.map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Form controls</h2>
        <div className={styles.cols}>
          <div className={styles.stack}>
            <Field label="Site name" name="name" placeholder="Central transport hub" required />
            <Field
              label="Asset code"
              name="code"
              defaultValue="BUS-42-REAR"
              hint="Unique across all inventory."
            />
            <Field
              label="Week rate"
              name="rate"
              defaultValue="95000"
              error="Rates are entered in pence."
            />
            <Field label="Read only" name="readonly" defaultValue="Cannot change" disabled />
          </div>
          <div className={styles.stack}>
            <Select
              label="Medium"
              name="medium"
              options={[
                { value: "STATIC", label: "Static" },
                { value: "DIGITAL", label: "Digital" },
              ]}
            />
            <Select
              label="Site"
              name="site"
              placeholder="Choose a site"
              defaultValue=""
              groups={[
                { label: "Depots", options: [{ value: "d1", label: "Georgetown depot" }] },
                { label: "Roadside", options: [{ value: "r1", label: "Vale Road north" }] },
              ]}
            />
            <Select
              label="Fitter"
              name="fitter"
              error="Pick someone who is on shift."
              options={[{ value: "f1", label: "Jon Mauger" }]}
            />
            <TextArea label="Notes" name="notes" placeholder="Anything the fitter needs to know." />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Date and duration</h2>
        <p className={styles.sectionNote}>
          Not a calendar. Bookings start on Mondays and run whole weeks, so the
          picker generates the legal options and the client cannot compose a
          window the database would reject. Lead time is applied before the
          Monday is chosen.
        </p>
        <div className={styles.cols}>
          <DatePicker leadTimeDays={7} from={REFERENCE_DATE} count={8} />
          <DurationPicker
            minWeeks={2}
            stepWeeks={1}
            max={8}
            hint="Minimum 2 weeks, any length above."
          />
          <DurationPicker
            label="Duration (billboard)"
            minWeeks={2}
            stepWeeks={2}
            max={12}
            hint="Sold in 2-week steps: 2, 4, 6, never 3."
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Table</h2>
        <Card padding="flush">
          <Table>
            <THead>
              <Tr>
                <Th>Client</Th>
                <Th>Placement</Th>
                <Th>Requested</Th>
                <Th numeric>Budget</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              <Tr>
                <Td strong>Northshore Retail</Td>
                <Td muted>Hub portrait screen network</Td>
                <Td muted>05 Oct to 19 Oct</Td>
                <Td numeric>{formatPence(120000)}</Td>
                <Td>
                  <StatusPill status="SUBMITTED" />
                </Td>
              </Tr>
              <Tr>
                <Td strong>Blue Rock Energy</Td>
                <Td muted>Charging-station screen</Td>
                <Td muted>12 Oct to 09 Nov</Td>
                <Td numeric>{formatPence(270000)}</Td>
                <Td>
                  <StatusPill status="HELD" />
                </Td>
              </Tr>
              <Tr>
                <Td strong>Harbour Foods</Td>
                <Td muted>Delivery van rear</Td>
                <Td muted>19 Oct to 02 Nov</Td>
                <Td numeric>{formatPence(95000)}</Td>
                <Td>
                  <StatusPill status="CONFIRMED" />
                </Td>
              </Tr>
            </TBody>
          </Table>
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Page header</h2>
        <Card>
          <PageHeader
            eyebrow="Operations overview"
            title="Booking requests"
            description="Newest first. Availability is recomputed when you open a request, not stored."
            actions={
              <>
                <Button variant="secondary">Export</Button>
                <Button>Create contract</Button>
              </>
            }
          />
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Empty state</h2>
        <p className={styles.sectionNote}>Says what to do next, never No data.</p>
        <EmptyState
          title="No inventory yet"
          description="Sites and assets are created on the map. Click anywhere on the canvas to place your first site."
          action={<Button href="/management">Open the map</Button>}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frame</h2>
        <p className={styles.sectionNote}>
          Ported from .im-public-frame. The corner brackets are the brand public
          frame idea: an advert as a frame placed in public space.
        </p>
        <Frame>
          <div className={styles.frameDemo}>
            <p>Islandwide reach, clearly managed</p>
          </div>
        </Frame>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Modal</h2>
        <ModalDemo />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Toast</h2>
        <div className={styles.stack}>
          <ToastSamples />
          <ToastDemo />
        </div>
      </section>
    </div>
  );
}
