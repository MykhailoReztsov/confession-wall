// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ConfessionWall
/// @notice An on-chain wall of confessions.
///         Once a confession is posted, it can NEVER be edited or deleted.
///         That permanence is the whole point.
contract ConfessionWall {
    struct Confession {
        uint256 id;        // position on the wall
        address author;    // wallet that posted it (pseudonymous, see note below)
        string text;       // the confession itself
        uint256 timestamp; // block time when it was posted
    }

    // Every confession ever posted. No delete function exists. On purpose.
    Confession[] private confessions;

    // Max confession length. 280 = tweet length. Also keeps gas sane.
    uint256 public constant MAX_LENGTH = 280;

    // Emitted on every new confession. Frontends can listen to this for live updates.
    event NewConfession(
        uint256 indexed id,
        address indexed author,
        string text,
        uint256 timestamp
    );

    /// @notice Post a confession to the wall. Permanent and irreversible.
    /// @param _text The confession. Must be non-empty and <= MAX_LENGTH characters.
    function confess(string calldata _text) external {
        bytes memory raw = bytes(_text);
        require(raw.length > 0, "Confession is empty");
        require(raw.length <= MAX_LENGTH, "Confession too long");

        uint256 id = confessions.length;

        confessions.push(
            Confession({
                id: id,
                author: msg.sender,
                text: _text,
                timestamp: block.timestamp
            })
        );

        emit NewConfession(id, msg.sender, _text, block.timestamp);
    }

    /// @notice Total number of confessions on the wall.
    function total() external view returns (uint256) {
        return confessions.length;
    }

    /// @notice Read every confession at once.
    function getAll() external view returns (Confession[] memory) {
        return confessions;
    }

    /// @notice Read a slice of the wall, so the frontend can paginate.
    /// @param start Index to start from.
    /// @param count How many confessions to return.
    function getRange(uint256 start, uint256 count)
        external
        view
        returns (Confession[] memory)
    {
        uint256 len = confessions.length;
        if (start >= len) {
            return new Confession[](0);
        }

        uint256 end = start + count;
        if (end > len) {
            end = len;
        }

        Confession[] memory page = new Confession[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = confessions[i];
        }
        return page;
    }
}
