<template>
  <div class="notepad" :style="divStyle">
    <table ref="table" :style="tableStyle">
      <tr>
        <th />
        <th v-for="player in players" :key="player.role.name">
          <div class="notepad__player-header">
            <RoleColor class="notepad__player-color" :role="player.role">
              {{ player.handSize }}
            </RoleColor>
            <span>{{ player.name }}</span>
          </div>
        </th>
      </tr>
      <tr>
        <th :colspan="players.length + 1">Roles</th>
      </tr>
      <tr v-for="card in skin.roles" :key="card.name">
        <th>{{ card.name }}</th>
        <td v-for="player in players" :key="player.role.name">
          <Note
            :marks="getMarks(player, card)"
            :showDropdown="isShownDropdown(player, card)"
            :onUpdate="note => setNote(player, card, note)"
            :toggleDropdown="() => toggleDropdown(player, card)"
          />
        </td>
      </tr>
      <tr>
        <th :colspan="players.length + 1">Places</th>
      </tr>
      <tr v-for="card in skin.places" :key="card.name">
        <th>{{ card.name }}</th>
        <td v-for="player in players" :key="player.role.name">
          <Note
            :marks="getMarks(player, card)"
            :showDropdown="isShownDropdown(player, card)"
            :onUpdate="note => setNote(player, card, note)"
            :toggleDropdown="() => toggleDropdown(player, card)"
          />
        </td>
      </tr>
      <tr>
        <th :colspan="players.length + 1">Tools</th>
      </tr>
      <tr v-for="card in skin.tools" :key="card.name">
        <th>{{ card.name }}</th>
        <td v-for="player in players" :key="player.role.name">
          <Note
            :marks="getMarks(player, card)"
            :showDropdown="isShownDropdown(player, card)"
            :onUpdate="note => setNote(player, card, note)"
            :toggleDropdown="() => toggleDropdown(player, card)"
          />
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue';

import Note from '@/components/Note.vue';
import RoleColor from '@/components/RoleColor.vue';
import { useEventListener } from '@/composables';
import { Card, Mark, Player, Skin } from '@/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

const makeNoteKey = (player: Player, card: Card) =>
  `${player.role.name}---${card.name}`;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`bad player color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export default defineComponent({
  name: 'Notepad',
  components: {
    Note,
    RoleColor,
  },
  props: {
    skin: {
      type: Object as PropType<Skin>,
      required: true,
    },
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    notes: {
      type: Object as PropType<Dict<Dict<Mark[]>>>,
      required: true,
    },
    setNote: {
      type: Function as PropType<
        (player: Player, card: Card, marks: Mark[]) => void
      >,
      required: true,
    },
  },
  setup() {
    const shownNoteDropdown = ref('');

    useEventListener(document, 'click', () => {
      shownNoteDropdown.value = '';
    });

    const table: Ref<Maybe<HTMLElement>> = ref(null);
    const tableScale = ref(1);
    const tableHeight = ref(0);

    const scaleTable = () => {
      if (!table.value) {
        return;
      }
      const tbl = table.value;
      const div = tbl.parentNode as HTMLElement;
      tableScale.value = Math.min(1, div.clientWidth / tbl.clientWidth);
      tableHeight.value = tbl.clientHeight * tableScale.value;
    };

    onMounted(scaleTable);
    useEventListener(window, 'resize', scaleTable);

    return {
      shownNoteDropdown,
      table,
      tableHeight,
      tableScale,
    };
  },
  computed: {
    colorVars(): Dict<string> {
      return dictFromList(this.players, (acc, player, i) => {
        const { r, g, b } = hexToRgb(player.role.color);
        acc[`--color-${i + 1}`] = `rgba(${r}, ${g}, ${b}, 0.1)`;
      });
    },
    tableStyle(): Dict<string> {
      return {
        ...this.colorVars,
        transform: `scale(${this.tableScale})`,
      };
    },
    divStyle(): Dict<string> {
      return {
        maxHeight: `${this.tableHeight}px`,
      };
    },
  },
  methods: {
    getMarks(player: Player, card: Card): Mark[] {
      return this.notes[player.role.name]?.[card.name] ?? [];
    },
    toggleDropdown(player: Player, card: Card) {
      const noteKey = makeNoteKey(player, card);
      this.shownNoteDropdown =
        this.shownNoteDropdown === noteKey ? '' : noteKey;
    },
    isShownDropdown(player: Player, card: Card) {
      return this.shownNoteDropdown === makeNoteKey(player, card);
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.notepad {
  text-align: center;
  cursor: default;
  margin: 0 (-$pad-lg);
  max-width: calc(100% + #{$pad-lg * 2});

  table {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    border-collapse: collapse;
    background-color: #fff;
    transform-origin: 0% 0% 0px;
  }

  tr:first-child > th {
    vertical-align: top;
  }

  td,
  th {
    border: 1px solid black;

    @for $i from 1 through 10 {
      &:nth-child(#{$i + 1}) {
        background-color: #{var(--color- + $i)};
      }
    }
  }

  th {
    font-weight: 600;
    padding: $pad-sm $pad-sm $pad-xs;
    white-space: nowrap;
  }

  td {
    cursor: pointer;
  }

  &__player-header {
    writing-mode: vertical-lr;
    white-space: nowrap;
  }

  &__player-color {
    margin-bottom: 1.2rem;
  }
}
</style>
